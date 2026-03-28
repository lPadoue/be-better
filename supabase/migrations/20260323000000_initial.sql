-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums
create type public.member_role as enum ('owner', 'member');
create type public.recurrence_type as enum ('relative', 'fixed');
create type public.recurrence_unit as enum ('hours', 'days', 'weeks', 'months');
create type public.sync_mode as enum ('shared', 'individual');
create type public.encouragement_status as enum ('active', 'rejected', 'pending');
create type public.invitation_status as enum ('pending', 'accepted', 'expired');

-- Users (mirrors auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Groups
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  owner_id uuid references public.users(id) on delete cascade not null,
  emoji text,
  created_at timestamptz default now() not null
);

-- Group Members
create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role public.member_role not null default 'member',
  joined_at timestamptz default now() not null,
  primary key (group_id, user_id)
);

-- Actions
create table public.actions (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  name text not null,
  emoji text,
  recurrence_type public.recurrence_type not null,
  recurrence_value integer,
  recurrence_unit public.recurrence_unit,
  fixed_month integer check (fixed_month between 1 and 12),
  fixed_day integer check (fixed_day between 1 and 31),
  warning_days integer,
  sync_mode public.sync_mode not null default 'individual',
  created_at timestamptz default now() not null
);

-- Action Completions
create table public.action_completions (
  id uuid default uuid_generate_v4() primary key,
  action_id uuid references public.actions(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  completed_at timestamptz default now() not null,
  note text
);

-- Encouragements
create table public.encouragements (
  id uuid default uuid_generate_v4() primary key,
  text text not null,
  author_id uuid references public.users(id) on delete set null,
  status public.encouragement_status not null default 'active',
  created_at timestamptz default now() not null
);

-- Group Invitations
create table public.group_invitations (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  invited_by uuid references public.users(id) on delete cascade not null,
  email text,
  created_at timestamptz default now() not null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days')
);

-- RLS
alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.actions enable row level security;
alter table public.action_completions enable row level security;
alter table public.encouragements enable row level security;
alter table public.group_invitations enable row level security;

-- Security definer function to avoid RLS recursion
create or replace function public.is_group_member(p_group_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = p_group_id and user_id = auth.uid());
$$;

-- users policies
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- groups policies
create policy "groups_select_members" on public.groups for select
  using (exists (select 1 from public.group_members where group_id = id and user_id = auth.uid()));
create policy "groups_insert" on public.groups for insert with check (owner_id = auth.uid());
create policy "groups_update_owner" on public.groups for update using (owner_id = auth.uid());
create policy "groups_delete_owner" on public.groups for delete using (owner_id = auth.uid());

-- group_members policies
create policy "group_members_select" on public.group_members for select
  using (public.is_group_member(group_id));
create policy "group_members_insert_self" on public.group_members for insert with check (user_id = auth.uid());
create policy "group_members_delete_self" on public.group_members for delete using (user_id = auth.uid());

-- actions policies
create policy "actions_select_members" on public.actions for select
  using (exists (select 1 from public.group_members where group_id = actions.group_id and user_id = auth.uid()));
create policy "actions_insert_owner" on public.actions for insert
  with check (exists (select 1 from public.groups where id = group_id and owner_id = auth.uid()));
create policy "actions_update_owner" on public.actions for update
  using (exists (select 1 from public.groups where id = group_id and owner_id = auth.uid()));
create policy "actions_delete_owner" on public.actions for delete
  using (exists (select 1 from public.groups where id = group_id and owner_id = auth.uid()));

-- action_completions policies
create policy "completions_select_members" on public.action_completions for select
  using (exists (
    select 1 from public.actions a
    join public.group_members gm on gm.group_id = a.group_id
    where a.id = action_id and gm.user_id = auth.uid()
  ));
create policy "completions_insert_members" on public.action_completions for insert
  with check (
    user_id = auth.uid() and
    exists (
      select 1 from public.actions a
      join public.group_members gm on gm.group_id = a.group_id
      where a.id = action_id and gm.user_id = auth.uid()
    )
  );
create policy "completions_delete_own" on public.action_completions for delete
  using (user_id = auth.uid());

-- encouragements: authenticated users can read active
create policy "encouragements_select_active" on public.encouragements
  for select using (auth.uid() is not null and status = 'active');

-- invitations: owner/members can read, owner can insert
create policy "invitations_select" on public.group_invitations for select
  using (
    invited_by = auth.uid() or
    exists (select 1 from public.group_members where group_id = group_invitations.group_id and user_id = auth.uid())
  );
create policy "invitations_insert_owner" on public.group_invitations for insert
  with check (exists (select 1 from public.groups where id = group_id and owner_id = auth.uid()));
create policy "invitations_update_token_holder" on public.group_invitations for update
  using (invited_by = auth.uid());
create policy "invitations_delete_owner" on public.group_invitations for delete
  using (exists (select 1 from public.groups where id = group_id and owner_id = auth.uid()));

-- Auto-create user profile on sign up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), nullif(new.raw_user_meta_data->>'name', ''), nullif(split_part(coalesce(new.email, ''), '@', 1), '')),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Performance indexes
create index on public.action_completions (action_id);
create index on public.action_completions (user_id);
create index on public.group_invitations (token);
create index on public.group_invitations (group_id);
