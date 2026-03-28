# Be Better — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app of personal reminders organized into themed groups, with shared countdowns, action validation, and encouragement phrases.

**Architecture:** Next.js App Router (frontend + server actions) backed by Supabase (PostgreSQL + Auth + Realtime). Business logic (recurrence, status) lives in pure TypeScript utils tested with Vitest. UI is dark-mode Tailwind, mobile-first.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (Auth + DB), Vitest + Testing Library, date-fns, Resend (emails)

---

## File Map

```
be-better/
├── app/
│   ├── (auth)/login/page.tsx          # Login page (email + OAuth buttons)
│   ├── (auth)/auth/callback/route.ts  # OAuth + magic link callback
│   ├── (app)/layout.tsx               # App shell with nav + auth guard
│   ├── (app)/page.tsx                 # Home: groups grid
│   ├── (app)/groups/new/page.tsx      # Create group form
│   ├── (app)/groups/[id]/page.tsx     # Group detail: actions list
│   ├── (app)/groups/[id]/settings/page.tsx  # Group settings + invite
│   ├── (app)/settings/page.tsx        # User profile
│   ├── invite/[token]/page.tsx        # Accept invitation
│   └── api/cron/notifications/route.ts # Daily email cron
├── components/
│   ├── groups/GroupCard.tsx           # Group summary card with status badges
│   ├── groups/CreateGroupForm.tsx     # New group form
│   ├── actions/ActionCard.tsx         # Action card: progress bar + done button
│   ├── actions/CreateActionForm.tsx   # New action form (recurrence config)
│   └── actions/CompletionToast.tsx    # Encouragement overlay on validation
├── lib/
│   ├── supabase/client.ts             # Browser Supabase client (singleton)
│   ├── supabase/server.ts             # Server Supabase client (RSC/actions)
│   ├── supabase/middleware.ts         # Session refresh middleware
│   ├── server/groups.ts               # Server actions: CRUD groups
│   ├── server/actions.ts              # Server actions: CRUD actions
│   ├── server/completions.ts          # Server actions: complete action
│   └── server/invitations.ts          # Server actions: invite + accept
├── lib/utils/
│   ├── recurrence.ts                  # Pure: nextDue, prevOccurrence, warningDays
│   └── status.ts                      # Pure: computeActionStatus → StatusResult
├── types/database.ts                  # TypeScript types for all DB tables
├── supabase/
│   ├── migrations/20260323000000_initial.sql
│   └── seed.sql                       # 10 encouragements phrases
├── emails/DailyReminder.tsx           # Resend React email template
└── tests/
    ├── utils/recurrence.test.ts
    ├── utils/status.test.ts
    └── components/ActionCard.test.tsx
```

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `vitest.config.ts`, `tsconfig.json`, `.env.local.example`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd C:/Users/Lohac/Documents/Projets/Be_better
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr date-fns resend
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @types/jsdom
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Create `.env.local.example`**

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key
CRON_SECRET=random_secret_for_cron_auth
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Copy to `.env.local` and fill in your Supabase project values.

- [ ] **Step 5: Verify setup**

```bash
npm run test:run
```
Expected: "No test files found" (no error)

```bash
npm run dev
```
Expected: Next.js starts on localhost:3000

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: initialize Next.js project with Supabase and Vitest"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `types/database.ts`

- [ ] **Step 1: Write types**

Create `types/database.ts`:

```typescript
export type RecurrenceType = 'relative' | 'fixed'
export type RecurrenceUnit = 'hours' | 'days' | 'weeks' | 'months'
export type SyncMode = 'shared' | 'individual'
export type MemberRole = 'owner' | 'member'
export type ActionStatus = 'never_done' | 'overdue' | 'warning' | 'ok'
export type EncouragementStatus = 'active' | 'rejected' | 'pending'
export type InvitationStatus = 'pending' | 'accepted' | 'expired'

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  owner_id: string
  emoji: string | null
  created_at: string
}

export interface GroupMember {
  group_id: string
  user_id: string
  role: MemberRole
  joined_at: string
}

export interface Action {
  id: string
  group_id: string
  name: string
  emoji: string | null
  recurrence_type: RecurrenceType
  recurrence_value: number | null
  recurrence_unit: RecurrenceUnit | null
  fixed_month: number | null
  fixed_day: number | null
  warning_days: number | null
  sync_mode: SyncMode
  created_at: string
}

export interface ActionCompletion {
  id: string
  action_id: string
  user_id: string
  completed_at: string
  note: string | null
}

export interface Encouragement {
  id: string
  text: string
  author_id: string | null
  status: EncouragementStatus
  created_at: string
}

export interface GroupInvitation {
  id: string
  group_id: string
  invited_by: string
  email: string | null
  token: string
  status: InvitationStatus
  expires_at: string
}

// Enriched types for UI
export interface GroupWithMembers extends Group {
  members: (GroupMember & { user: User })[]
}

export interface ActionWithLastCompletion extends Action {
  last_completion: ActionCompletion | null
  // For individual mode: current user's last completion
  user_last_completion: ActionCompletion | null
}
```

- [ ] **Step 2: Commit**

```bash
git add types/database.ts
git commit -m "feat: add TypeScript database types"
```

---

## Task 3: Database Schema

**Files:**
- Create: `supabase/migrations/20260323000000_initial.sql`
- Create: `supabase/seed.sql`

- [ ] **Step 1: Install Supabase CLI (if not installed)**

```bash
npm install -g supabase
supabase --version
```
Expected: prints version like `1.x.x`

- [ ] **Step 2: Write migration**

Create `supabase/migrations/20260323000000_initial.sql`:

```sql
-- Extensions
create extension if not exists "uuid-ossp";

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
  email text not null,
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
  using (exists (select 1 from public.group_members gm where gm.group_id = group_id and gm.user_id = auth.uid()));
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

-- Auto-create user profile on sign up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 3: Write seed data**

Create `supabase/seed.sql`:

```sql
insert into public.encouragements (text, status) values
  ('Bravo, chaque petit geste compte ✨', 'active'),
  ('Tu es sur la bonne voie 🚀', 'active'),
  ('Tes proches sourient de loin ❤️', 'active'),
  ('Petite action, grand impact 💪', 'active'),
  ('C''est comme ça qu''on devient meilleur, un jour à la fois 🌱', 'active'),
  ('Tu l''as fait ! Fierté méritée 🎉', 'active'),
  ('Action validée. Tu déchires 🔥', 'active'),
  ('Ton futur toi te remercie 🙏', 'active'),
  ('Et voilà, encore une belle victoire 🏆', 'active'),
  ('La régularité, c''est ton super-pouvoir ⚡', 'active');
```

- [ ] **Step 4: Apply migration in Supabase dashboard**

Go to your Supabase project → SQL Editor → paste and run the migration SQL.
Then run the seed SQL.

- [ ] **Step 5: Enable Google and Apple OAuth in Supabase**

In Supabase Dashboard → Authentication → Providers:
- Enable Google: add Client ID + Secret from Google Cloud Console
- Enable Apple: add Key ID + Team ID + Private Key from Apple Developer

Set redirect URL in each provider to: `https://your-project.supabase.co/auth/v1/callback`

- [ ] **Step 6: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema migration and seed data"
```

---

## Task 4: Recurrence Utils (TDD)

**Files:**
- Create: `lib/utils/recurrence.ts`
- Create: `tests/utils/recurrence.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/utils/recurrence.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  addRecurrence,
  nextFixedOccurrence,
  prevFixedOccurrence,
  defaultWarningDays,
} from '@/lib/utils/recurrence'

describe('addRecurrence', () => {
  it('adds hours', () => {
    const base = new Date('2026-01-01T10:00:00Z')
    const result = addRecurrence(base, 24, 'hours')
    expect(result).toEqual(new Date('2026-01-02T10:00:00Z'))
  })

  it('adds days', () => {
    const base = new Date('2026-01-01')
    const result = addRecurrence(base, 3, 'days')
    expect(result).toEqual(new Date('2026-01-04'))
  })

  it('adds weeks', () => {
    const base = new Date('2026-01-01')
    const result = addRecurrence(base, 2, 'weeks')
    expect(result).toEqual(new Date('2026-01-15'))
  })

  it('adds months', () => {
    const base = new Date('2026-01-01')
    const result = addRecurrence(base, 6, 'months')
    expect(result).toEqual(new Date('2026-07-01'))
  })
})

describe('nextFixedOccurrence', () => {
  it('returns this year if date is in the future', () => {
    const from = new Date('2026-01-01')
    const result = nextFixedOccurrence(3, 15, from) // March 15
    expect(result).toEqual(new Date(2026, 2, 15))
  })

  it('returns next year if date has passed', () => {
    const from = new Date('2026-04-01')
    const result = nextFixedOccurrence(3, 15, from) // March 15 already passed
    expect(result).toEqual(new Date(2027, 2, 15))
  })

  it('returns same day if from equals the occurrence', () => {
    const from = new Date(2026, 2, 15, 0, 0, 1) // March 15 + 1 second
    const result = nextFixedOccurrence(3, 15, from)
    expect(result).toEqual(new Date(2027, 2, 15))
  })
})

describe('prevFixedOccurrence', () => {
  it('returns this year if date has passed', () => {
    const from = new Date('2026-04-01')
    const result = prevFixedOccurrence(3, 15, from) // March 15 has passed
    expect(result).toEqual(new Date(2026, 2, 15))
  })

  it('returns last year if date not yet reached', () => {
    const from = new Date('2026-01-01')
    const result = prevFixedOccurrence(3, 15, from) // March 15 not yet reached
    expect(result).toEqual(new Date(2025, 2, 15))
  })
})

describe('defaultWarningDays', () => {
  it('returns 7 for fixed recurrence', () => {
    expect(defaultWarningDays('fixed')).toBe(7)
  })

  it('returns 20% of period for relative (days)', () => {
    expect(defaultWarningDays('relative', 10, 'days')).toBe(2)
  })

  it('returns 20% of period for relative (weeks)', () => {
    expect(defaultWarningDays('relative', 3, 'weeks')).toBe(4) // 21 days * 0.2 = 4.2 → 4
  })

  it('returns minimum 1', () => {
    expect(defaultWarningDays('relative', 1, 'days')).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test:run tests/utils/recurrence.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/utils/recurrence'`

- [ ] **Step 3: Implement recurrence utils**

Create `lib/utils/recurrence.ts`:

```typescript
import { addHours, addDays, addWeeks, addMonths } from 'date-fns'
import type { RecurrenceUnit } from '@/types/database'

export { RecurrenceUnit }

export function addRecurrence(date: Date, value: number, unit: RecurrenceUnit): Date {
  switch (unit) {
    case 'hours': return addHours(date, value)
    case 'days': return addDays(date, value)
    case 'weeks': return addWeeks(date, value)
    case 'months': return addMonths(date, value)
  }
}

export function nextFixedOccurrence(month: number, day: number, from: Date = new Date()): Date {
  const thisYear = new Date(from.getFullYear(), month - 1, day)
  if (thisYear > from) return thisYear
  return new Date(from.getFullYear() + 1, month - 1, day)
}

export function prevFixedOccurrence(month: number, day: number, from: Date = new Date()): Date {
  const thisYear = new Date(from.getFullYear(), month - 1, day)
  if (thisYear <= from) return thisYear
  return new Date(from.getFullYear() - 1, month - 1, day)
}

export function defaultWarningDays(
  recurrenceType: 'relative' | 'fixed',
  recurrenceValue?: number,
  recurrenceUnit?: RecurrenceUnit
): number {
  if (recurrenceType === 'fixed') return 7
  if (!recurrenceValue || !recurrenceUnit) return 1
  const totalDays =
    recurrenceUnit === 'hours' ? recurrenceValue / 24
    : recurrenceUnit === 'days' ? recurrenceValue
    : recurrenceUnit === 'weeks' ? recurrenceValue * 7
    : recurrenceValue * 30
  return Math.max(1, Math.round(totalDays * 0.2))
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test:run tests/utils/recurrence.test.ts
```
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/utils/recurrence.ts tests/utils/recurrence.test.ts
git commit -m "feat: add recurrence utils with tests"
```

---

## Task 5: Status Utils (TDD)

**Files:**
- Create: `lib/utils/status.ts`
- Create: `tests/utils/status.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/utils/status.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { computeActionStatus } from '@/lib/utils/status'
import type { Action } from '@/types/database'

const relativeAction: Action = {
  id: 'a1', group_id: 'g1', name: 'Test', emoji: null,
  recurrence_type: 'relative', recurrence_value: 7, recurrence_unit: 'days',
  fixed_month: null, fixed_day: null, warning_days: null,
  sync_mode: 'individual', created_at: '2026-01-01',
}

const fixedAction: Action = {
  id: 'a2', group_id: 'g1', name: 'Birthday', emoji: null,
  recurrence_type: 'fixed', recurrence_value: null, recurrence_unit: null,
  fixed_month: 3, fixed_day: 15, warning_days: null,
  sync_mode: 'individual', created_at: '2026-01-01',
}

describe('computeActionStatus — relative', () => {
  it('returns never_done when no completion', () => {
    const result = computeActionStatus(relativeAction, null)
    expect(result.status).toBe('never_done')
    expect(result.label).toBe('Jamais fait')
    expect(result.progress).toBe(0)
  })

  it('returns ok when well within period', () => {
    const lastCompletion = new Date('2026-03-01')
    const now = new Date('2026-03-03') // 2 days after, 7 day period
    const result = computeActionStatus(relativeAction, lastCompletion, now)
    expect(result.status).toBe('ok')
    expect(result.progress).toBeGreaterThan(0)
    expect(result.progress).toBeLessThan(1)
  })

  it('returns warning when within warning threshold', () => {
    const lastCompletion = new Date('2026-03-01')
    const now = new Date('2026-03-07T00:00:01Z') // 6 days + 1s after (warning = 1 day before)
    const result = computeActionStatus(relativeAction, lastCompletion, now)
    expect(result.status).toBe('warning')
  })

  it('returns overdue when past next_due', () => {
    const lastCompletion = new Date('2026-03-01')
    const now = new Date('2026-03-10') // 9 days after, past 7-day period
    const result = computeActionStatus(relativeAction, lastCompletion, now)
    expect(result.status).toBe('overdue')
    expect(result.label).toMatch(/retard/)
  })

  it('progress is 1 when overdue', () => {
    const lastCompletion = new Date('2026-03-01')
    const now = new Date('2026-03-20')
    const result = computeActionStatus(relativeAction, lastCompletion, now)
    expect(result.progress).toBe(1)
  })
})

describe('computeActionStatus — fixed', () => {
  it('returns never_done with no completion even if date passed', () => {
    // March 15 2026, we're in April 2026 but never done
    const now = new Date('2026-04-01')
    const result = computeActionStatus(fixedAction, null, now)
    expect(result.status).toBe('never_done')
  })

  it('returns ok when done this year and next occurrence is far', () => {
    // Done March 14, next due March 15 2027, now is March 16 2026
    const lastCompletion = new Date('2026-03-14')
    const now = new Date('2026-03-16')
    const result = computeActionStatus(fixedAction, lastCompletion, now)
    expect(result.status).toBe('ok')
  })

  it('returns warning when within 7 days of fixed date', () => {
    // next due March 15 2027, now is March 10 2027 (5 days before)
    const lastCompletion = new Date('2026-03-14')
    const now = new Date('2027-03-10')
    const result = computeActionStatus(fixedAction, lastCompletion, now)
    expect(result.status).toBe('warning')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test:run tests/utils/status.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement status utils**

Create `lib/utils/status.ts`:

```typescript
import { subDays } from 'date-fns'
import { addRecurrence, nextFixedOccurrence, prevFixedOccurrence, defaultWarningDays } from './recurrence'
import type { Action, ActionStatus } from '@/types/database'

export interface StatusResult {
  status: ActionStatus
  nextDue: Date | null
  progress: number  // 0–1
  label: string
}

export function computeActionStatus(
  action: Action,
  lastCompletion: Date | null,
  now: Date = new Date()
): StatusResult {
  if (!lastCompletion) {
    return { status: 'never_done', nextDue: null, progress: 0, label: 'Jamais fait' }
  }

  let nextDue: Date
  let periodStart: Date

  if (action.recurrence_type === 'relative') {
    nextDue = addRecurrence(lastCompletion, action.recurrence_value!, action.recurrence_unit!)
    periodStart = lastCompletion
  } else {
    nextDue = nextFixedOccurrence(action.fixed_month!, action.fixed_day!, now)
    periodStart = prevFixedOccurrence(action.fixed_month!, action.fixed_day!, now)
  }

  const warnDays = action.warning_days ?? defaultWarningDays(
    action.recurrence_type,
    action.recurrence_value ?? undefined,
    action.recurrence_unit ?? undefined
  )
  const warnThreshold = subDays(nextDue, warnDays)

  const totalMs = nextDue.getTime() - periodStart.getTime()
  const elapsedMs = now.getTime() - periodStart.getTime()
  const progress = Math.min(1, Math.max(0, elapsedMs / totalMs))

  let status: ActionStatus
  if (now > nextDue) status = 'overdue'
  else if (now > warnThreshold) status = 'warning'
  else status = 'ok'

  return { status, nextDue, progress, label: formatLabel(status, nextDue, now) }
}

function formatLabel(status: ActionStatus, nextDue: Date, now: Date): string {
  if (status === 'overdue') {
    const days = Math.floor((now.getTime() - nextDue.getTime()) / 86400000)
    return days === 0 ? 'En retard' : `En retard de ${days}j`
  }
  const diffMs = nextDue.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  const diffHours = Math.floor(diffMs / 3600000)
  if (diffDays === 0) return diffHours <= 1 ? "Dans moins d'1h" : `Dans ${diffHours}h`
  if (diffDays === 1) return 'Demain'
  return `Dans ${diffDays}j`
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test:run tests/utils/status.test.ts
```
Expected: All tests PASS

- [ ] **Step 5: Run all tests**

```bash
npm run test:run
```
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add lib/utils/status.ts tests/utils/status.test.ts
git commit -m "feat: add action status utils with tests"
```

---

## Task 6: Supabase Client + Middleware

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`
- Create: `middleware.ts` (root)

- [ ] **Step 1: Browser client**

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Server client**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
}

export async function createServiceClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: Middleware**

Create `lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login (except auth routes and invite)
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/invite')

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

Create `middleware.ts` (root):

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/ middleware.ts
git commit -m "feat: add Supabase client and auth middleware"
```

---

## Task 7: Authentication

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/auth/callback/route.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Root layout**

Replace content of `app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Be Better',
  description: 'Rappels personnels pour devenir meilleur',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Login page**

Create `app/(auth)/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    })
  }

  async function signInWithApple() {
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Be Better</h1>
          <p className="text-slate-400 mt-2">Deviens la meilleure version de toi-même</p>
        </div>

        {sent ? (
          <div className="bg-slate-800 rounded-2xl p-6 text-center">
            <p className="text-lg">📬 Vérifie ton email !</p>
            <p className="text-slate-400 text-sm mt-2">Lien de connexion envoyé à {email}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={signInWithGoogle}
              className="w-full bg-white text-slate-900 font-medium py-3 px-4 rounded-xl hover:bg-slate-100 transition flex items-center justify-center gap-2"
            >
              <span>🌐</span> Continuer avec Google
            </button>
            <button
              onClick={signInWithApple}
              className="w-full bg-slate-800 text-white font-medium py-3 px-4 rounded-xl hover:bg-slate-700 transition flex items-center justify-center gap-2 border border-slate-700"
            >
              <span>🍎</span> Continuer avec Apple
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-slate-950 px-2 text-slate-500">ou par email</span>
              </div>
            </div>

            <form onSubmit={signInWithEmail} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ton@email.com"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-4 rounded-xl transition disabled:opacity-50"
              >
                {loading ? 'Envoi...' : 'Recevoir un lien magique'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Auth callback route**

Create `app/(auth)/auth/callback/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
```

- [ ] **Step 4: Test login manually**

```bash
npm run dev
```
Open `http://localhost:3000`. Should redirect to `/login`. Enter email → check email for magic link. Should redirect back to app home (404 for now, that's OK).

- [ ] **Step 5: Commit**

```bash
git add app/
git commit -m "feat: add authentication (email magic link + Google + Apple)"
```

---

## Task 8: App Layout + Home Page Structure

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/page.tsx`

- [ ] **Step 1: App shell layout**

Create `app/(app)/layout.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-violet-400">Be Better</Link>
        <Link href="/settings" className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm">
          {user.email?.[0].toUpperCase()}
        </Link>
      </header>
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Home page (groups list)**

Create `app/(app)/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import GroupCard from '@/components/groups/GroupCard'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, role, groups(*)')
    .eq('user_id', user!.id)

  const groups = memberships?.map(m => m.groups).filter(Boolean) ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes groupes</h1>
        <Link
          href="/groups/new"
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          + Nouveau
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-4">🌱</p>
          <p className="font-medium">Aucun groupe encore</p>
          <p className="text-sm mt-1">Crée ton premier groupe pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(groups as any[]).map(group => (
            <GroupCard key={group.id} group={group} userId={user!.id} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/
git commit -m "feat: add app layout and home page structure"
```

---

## Task 9: GroupCard Component + Groups CRUD

**Files:**
- Create: `components/groups/GroupCard.tsx`
- Create: `components/groups/CreateGroupForm.tsx`
- Create: `lib/server/groups.ts`
- Create: `app/(app)/groups/new/page.tsx`

- [ ] **Step 1: Groups server actions**

Create `lib/server/groups.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createGroup(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const emoji = formData.get('emoji') as string | null

  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, description, emoji, owner_id: user.id })
    .select()
    .single()

  if (error) throw error

  // Auto-add owner as member
  await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: user.id,
    role: 'owner',
  })

  revalidatePath('/')
  redirect(`/groups/${group.id}`)
}

export async function deleteGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase.from('groups').delete().eq('id', groupId).eq('owner_id', user.id)
  revalidatePath('/')
  redirect('/')
}
```

- [ ] **Step 2: GroupCard component**

Create `components/groups/GroupCard.tsx`:

```typescript
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { computeActionStatus } from '@/lib/utils/status'
import type { Group, Action, ActionCompletion } from '@/types/database'

const STATUS_COLORS = {
  overdue: 'bg-red-500',
  warning: 'bg-orange-500',
  ok: 'bg-green-500',
  never_done: 'bg-slate-500',
}

interface Props {
  group: Group
  userId: string
}

export default async function GroupCard({ group, userId }: Props) {
  const supabase = await createClient()

  const { data: actions } = await supabase
    .from('actions')
    .select('*')
    .eq('group_id', group.id)

  if (!actions?.length) {
    return (
      <Link href={`/groups/${group.id}`}>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:border-slate-600 transition">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{group.emoji ?? '📋'}</span>
            <div>
              <p className="font-semibold">{group.name}</p>
              <p className="text-slate-500 text-sm">Aucune action</p>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Get last completions for all actions
  const actionIds = actions.map(a => a.id)
  const { data: completions } = await supabase
    .from('action_completions')
    .select('*')
    .in('action_id', actionIds)
    .order('completed_at', { ascending: false })

  const statusCounts = { overdue: 0, warning: 0, ok: 0, never_done: 0 }

  for (const action of actions) {
    const relevantCompletions = (completions ?? []).filter(c => c.action_id === action.id)
    const lastCompletion = action.sync_mode === 'shared'
      ? relevantCompletions[0]
      : relevantCompletions.find(c => c.user_id === userId)

    const { status } = computeActionStatus(
      action,
      lastCompletion ? new Date(lastCompletion.completed_at) : null
    )
    statusCounts[status]++
  }

  return (
    <Link href={`/groups/${group.id}`}>
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:border-slate-600 transition">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{group.emoji ?? '📋'}</span>
            <p className="font-semibold">{group.name}</p>
          </div>
          <div className="flex gap-1.5">
            {statusCounts.overdue > 0 && (
              <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full font-medium">
                {statusCounts.overdue} en retard
              </span>
            )}
            {statusCounts.warning > 0 && (
              <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full font-medium">
                {statusCounts.warning} bientôt
              </span>
            )}
            {statusCounts.overdue === 0 && statusCounts.warning === 0 && (
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-medium">
                ✓ OK
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: CreateGroupForm**

Create `components/groups/CreateGroupForm.tsx`:

```typescript
'use client'

import { createGroup } from '@/lib/server/groups'

const EMOJIS = ['👨‍👩‍👧', '🐱', '💪', '❤️', '🌱', '🏃', '🍎', '📚', '🎯', '🌟']

export default function CreateGroupForm() {
  return (
    <form action={createGroup} className="space-y-4">
      <div>
        <label className="text-sm text-slate-400 block mb-1">Emoji</label>
        <div className="flex gap-2 flex-wrap">
          {EMOJIS.map(e => (
            <label key={e} className="cursor-pointer">
              <input type="radio" name="emoji" value={e} className="sr-only peer" defaultChecked={e === '🎯'} />
              <span className="text-2xl p-2 rounded-xl peer-checked:bg-violet-600/30 peer-checked:ring-2 peer-checked:ring-violet-500 block hover:bg-slate-700 transition">
                {e}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-400 block mb-1">Nom du groupe *</label>
        <input
          name="name"
          required
          placeholder="Be better son"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 block mb-1">Description</label>
        <input
          name="description"
          placeholder="Optionnel"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-4 rounded-xl transition"
      >
        Créer le groupe
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Create group page**

Create `app/(app)/groups/new/page.tsx`:

```typescript
import CreateGroupForm from '@/components/groups/CreateGroupForm'
import Link from 'next/link'

export default function NewGroupPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-slate-400 hover:text-white">←</Link>
        <h1 className="text-2xl font-bold">Nouveau groupe</h1>
      </div>
      <CreateGroupForm />
    </div>
  )
}
```

- [ ] **Step 5: Test in browser**

```bash
npm run dev
```
- Login, go to home → click "+ Nouveau"
- Fill form, submit → should redirect to the group page (404 for now)
- Back to home → group card should appear

- [ ] **Step 6: Commit**

```bash
git add components/groups/ lib/server/groups.ts app/\(app\)/groups/
git commit -m "feat: add group creation and group card with status badges"
```

---

## Task 10: Actions CRUD

**Files:**
- Create: `lib/server/actions.ts`
- Create: `components/actions/CreateActionForm.tsx`
- Create: `app/(app)/groups/[id]/page.tsx`

- [ ] **Step 1: Actions server actions**

Create `lib/server/actions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAction(groupId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const recurrenceType = formData.get('recurrence_type') as 'relative' | 'fixed'

  const actionData: any = {
    group_id: groupId,
    name: formData.get('name') as string,
    emoji: formData.get('emoji') as string || null,
    recurrence_type: recurrenceType,
    sync_mode: formData.get('sync_mode') as 'shared' | 'individual',
  }

  if (recurrenceType === 'relative') {
    actionData.recurrence_value = parseInt(formData.get('recurrence_value') as string)
    actionData.recurrence_unit = formData.get('recurrence_unit') as string
  } else {
    actionData.fixed_month = parseInt(formData.get('fixed_month') as string)
    actionData.fixed_day = parseInt(formData.get('fixed_day') as string)
  }

  await supabase.from('actions').insert(actionData)
  revalidatePath(`/groups/${groupId}`)
}

export async function deleteAction(actionId: string, groupId: string) {
  const supabase = await createClient()
  await supabase.from('actions').delete().eq('id', actionId)
  revalidatePath(`/groups/${groupId}`)
}
```

- [ ] **Step 2: CreateActionForm**

Create `components/actions/CreateActionForm.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { createAction } from '@/lib/server/actions'

const EMOJIS = ['📞', '🎂', '🍽️', '💊', '🎮', '🏃', '📚', '❤️', '🌱', '✨']

export default function CreateActionForm({ groupId }: { groupId: string }) {
  const [recurrenceType, setRecurrenceType] = useState<'relative' | 'fixed'>('relative')
  const [open, setOpen] = useState(false)

  const action = createAction.bind(null, groupId)

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full border border-dashed border-slate-700 rounded-2xl p-4 text-slate-500 hover:border-slate-500 hover:text-slate-400 transition text-sm"
        >
          + Ajouter une action
        </button>
      ) : (
        <form
          action={async (formData) => { await action(formData); setOpen(false) }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3"
        >
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                name="name"
                required
                placeholder="Nom de l'action"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <select
              name="emoji"
              className="bg-slate-900 border border-slate-700 rounded-xl px-2 text-lg focus:outline-none"
            >
              {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Type de récurrence</label>
            <div className="flex gap-2">
              <label className="flex-1">
                <input type="radio" name="recurrence_type" value="relative"
                  checked={recurrenceType === 'relative'}
                  onChange={() => setRecurrenceType('relative')} className="sr-only peer" />
                <span className="block text-center text-sm py-2 rounded-xl border border-slate-700 peer-checked:border-violet-500 peer-checked:bg-violet-600/20 cursor-pointer">
                  Intervalle
                </span>
              </label>
              <label className="flex-1">
                <input type="radio" name="recurrence_type" value="fixed"
                  checked={recurrenceType === 'fixed'}
                  onChange={() => setRecurrenceType('fixed')} className="sr-only peer" />
                <span className="block text-center text-sm py-2 rounded-xl border border-slate-700 peer-checked:border-violet-500 peer-checked:bg-violet-600/20 cursor-pointer">
                  Date fixe
                </span>
              </label>
            </div>
          </div>

          {recurrenceType === 'relative' ? (
            <div className="flex gap-2">
              <input
                name="recurrence_value"
                type="number"
                min="1"
                defaultValue="7"
                className="w-20 bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none"
              />
              <select name="recurrence_unit" className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 text-sm focus:outline-none">
                <option value="hours">heures</option>
                <option value="days">jours</option>
                <option value="weeks" selected>semaines</option>
                <option value="months">mois</option>
              </select>
            </div>
          ) : (
            <div className="flex gap-2">
              <input name="fixed_day" type="number" min="1" max="31" placeholder="Jour"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none" />
              <input name="fixed_month" type="number" min="1" max="12" placeholder="Mois"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none" />
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400 block mb-1">Partage</label>
            <select name="sync_mode" className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-sm focus:outline-none">
              <option value="individual">Individuel (chacun son compteur)</option>
              <option value="shared">Commun (un compteur pour tous)</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 hover:text-white transition">
              Annuler
            </button>
            <button type="submit"
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2.5 rounded-xl transition">
              Ajouter
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Group detail page (skeleton — full ActionCard in next task)**

Create `app/(app)/groups/[id]/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CreateActionForm from '@/components/actions/CreateActionForm'
import ActionCard from '@/components/actions/ActionCard'

export default async function GroupPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!group) notFound()

  const { data: actions } = await supabase
    .from('actions')
    .select('*')
    .eq('group_id', params.id)
    .order('created_at')

  const actionIds = actions?.map(a => a.id) ?? []
  const { data: completions } = actionIds.length
    ? await supabase
        .from('action_completions')
        .select('*')
        .in('action_id', actionIds)
        .order('completed_at', { ascending: false })
    : { data: [] }

  const { data: members } = await supabase
    .from('group_members')
    .select('*, users(*)')
    .eq('group_id', params.id)

  const isOwner = group.owner_id === user!.id

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-slate-400 hover:text-white">←</Link>
        <span className="text-2xl">{group.emoji ?? '📋'}</span>
        <h1 className="text-2xl font-bold flex-1">{group.name}</h1>
        {isOwner && (
          <Link href={`/groups/${params.id}/settings`} className="text-slate-400 hover:text-white text-sm">
            ⚙️
          </Link>
        )}
      </div>

      {group.description && (
        <p className="text-slate-400 text-sm">{group.description}</p>
      )}

      <div className="space-y-3">
        {(actions ?? []).map(action => {
          const allCompletions = (completions ?? []).filter(c => c.action_id === action.id)
          const lastShared = allCompletions[0] ?? null
          const lastMine = allCompletions.find(c => c.user_id === user!.id) ?? null
          return (
            <ActionCard
              key={action.id}
              action={action}
              lastSharedCompletion={lastShared}
              lastUserCompletion={lastMine}
              currentUserId={user!.id}
              groupId={params.id}
            />
          )
        })}
      </div>

      <CreateActionForm groupId={params.id} />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/server/actions.ts components/actions/CreateActionForm.tsx app/\(app\)/groups/
git commit -m "feat: add action CRUD and group detail page"
```

---

## Task 11: ActionCard + CompletionToast

**Files:**
- Create: `components/actions/ActionCard.tsx`
- Create: `components/actions/CompletionToast.tsx`
- Create: `lib/server/completions.ts`
- Create: `tests/components/ActionCard.test.tsx`

- [ ] **Step 1: Completions server action**

Create `lib/server/completions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeAction(actionId: string, groupId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase.from('action_completions').insert({
    action_id: actionId,
    user_id: user.id,
  })

  // Fetch a random encouragement
  const { data: encouragements } = await supabase
    .from('encouragements')
    .select('text')
    .eq('status', 'active')

  const pool = encouragements ?? []
  const phrase = pool.length > 0
    ? pool[Math.floor(Math.random() * pool.length)].text
    : 'Bien joué ! ✨'

  revalidatePath(`/groups/${groupId}`)
  return phrase
}
```

- [ ] **Step 2: CompletionToast**

Create `components/actions/CompletionToast.tsx`:

```typescript
'use client'

import { useEffect } from 'react'

interface Props {
  phrase: string
  onDone: () => void
}

export default function CompletionToast({ phrase, onDone }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm"
      onClick={onDone}
    >
      <div className="text-center px-8 animate-bounce-in">
        <div className="text-6xl mb-6">✅</div>
        <p className="text-2xl font-semibold text-white max-w-xs">{phrase}</p>
        <p className="text-slate-500 text-sm mt-4">Tape pour continuer</p>
      </div>
    </div>
  )
}
```

Add to `app/globals.css`:
```css
@keyframes bounce-in {
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}
.animate-bounce-in {
  animation: bounce-in 0.4s ease-out;
}
```

- [ ] **Step 3: ActionCard component**

Create `components/actions/ActionCard.tsx`:

```typescript
'use client'

import { useState, useTransition } from 'react'
import { completeAction } from '@/lib/server/completions'
import { computeActionStatus } from '@/lib/utils/status'
import CompletionToast from './CompletionToast'
import type { Action, ActionCompletion } from '@/types/database'

const STATUS_STYLES = {
  overdue: { bar: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/30' },
  warning: { bar: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/30' },
  ok: { bar: 'bg-green-500', text: 'text-green-400', border: 'border-slate-700' },
  never_done: { bar: 'bg-slate-600', text: 'text-slate-500', border: 'border-slate-700' },
}

interface Props {
  action: Action
  lastSharedCompletion: ActionCompletion | null
  lastUserCompletion: ActionCompletion | null
  currentUserId: string
  groupId: string
}

export default function ActionCard({
  action, lastSharedCompletion, lastUserCompletion, currentUserId, groupId
}: Props) {
  const [phrase, setPhrase] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const relevantCompletion = action.sync_mode === 'shared' ? lastSharedCompletion : lastUserCompletion
  const { status, progress, label } = computeActionStatus(
    action,
    relevantCompletion ? new Date(relevantCompletion.completed_at) : null
  )

  const styles = STATUS_STYLES[status]

  function handleDone() {
    startTransition(async () => {
      const p = await completeAction(action.id, groupId)
      setPhrase(p)
    })
  }

  return (
    <>
      {phrase && <CompletionToast phrase={phrase} onDone={() => setPhrase(null)} />}

      <div className={`bg-slate-800/50 border ${styles.border} rounded-2xl p-4`}>
        <div className="flex items-center gap-3">
          <span className="text-xl shrink-0">{action.emoji ?? '✓'}</span>

          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{action.name}</p>
            <p className={`text-xs mt-0.5 ${styles.text}`}>{label}</p>

            {/* Progress bar */}
            <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${styles.bar} rounded-full transition-all duration-500`}
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleDone}
            disabled={isPending}
            className="shrink-0 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-sm transition"
          >
            {isPending ? '...' : '✓ Fait'}
          </button>
        </div>

        {action.sync_mode === 'shared' && lastSharedCompletion && (
          <p className="text-xs text-slate-500 mt-2 pl-8">
            Dernière fois : {new Date(lastSharedCompletion.completed_at).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 4: Write component test**

Create `tests/components/ActionCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ActionCard from '@/components/actions/ActionCard'
import type { Action } from '@/types/database'

// Mock server actions
vi.mock('@/lib/server/completions', () => ({
  completeAction: vi.fn().mockResolvedValue('Bravo ! ✨'),
}))

const baseAction: Action = {
  id: 'a1', group_id: 'g1', name: 'Appeler mes parents', emoji: '📞',
  recurrence_type: 'relative', recurrence_value: 7, recurrence_unit: 'days',
  fixed_month: null, fixed_day: null, warning_days: null,
  sync_mode: 'individual', created_at: '2026-01-01',
}

describe('ActionCard', () => {
  it('renders action name', () => {
    render(
      <ActionCard
        action={baseAction}
        lastSharedCompletion={null}
        lastUserCompletion={null}
        currentUserId="u1"
        groupId="g1"
      />
    )
    expect(screen.getByText('Appeler mes parents')).toBeInTheDocument()
  })

  it('shows "Jamais fait" when no completion', () => {
    render(
      <ActionCard
        action={baseAction}
        lastSharedCompletion={null}
        lastUserCompletion={null}
        currentUserId="u1"
        groupId="g1"
      />
    )
    expect(screen.getByText('Jamais fait')).toBeInTheDocument()
  })

  it('renders done button', () => {
    render(
      <ActionCard
        action={baseAction}
        lastSharedCompletion={null}
        lastUserCompletion={null}
        currentUserId="u1"
        groupId="g1"
      />
    )
    expect(screen.getByText('✓ Fait')).toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Run tests**

```bash
npm run test:run
```
Expected: All tests PASS

- [ ] **Step 6: Test in browser**

- Go to a group, add an action
- Click "✓ Fait" → toast appears with encouragement phrase
- Card updates with new status + progress

- [ ] **Step 7: Commit**

```bash
git add components/actions/ lib/server/completions.ts tests/components/ app/globals.css
git commit -m "feat: add ActionCard with progress bar, completion, and encouragement toast"
```

---

## Task 12: Group Sharing (Invite Link)

**Files:**
- Create: `lib/server/invitations.ts`
- Create: `app/(app)/groups/[id]/settings/page.tsx`
- Create: `app/invite/[token]/page.tsx`

- [ ] **Step 1: Invitations server actions**

Create `lib/server/invitations.ts`:

```typescript
'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createInvitation(groupId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data } = await supabase
    .from('group_invitations')
    .insert({ group_id: groupId, invited_by: user.id })
    .select('token')
    .single()

  return `${process.env.NEXT_PUBLIC_APP_URL}/invite/${data!.token}`
}

export async function acceptInvitation(token: string) {
  // Use service client to read invitation regardless of RLS
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/invite/${token}`)

  const { data: invitation } = await serviceSupabase
    .from('group_invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (!invitation) return { error: 'Invitation invalide ou expirée' }
  if (new Date(invitation.expires_at) < new Date()) {
    await serviceSupabase
      .from('group_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id)
    return { error: 'Invitation expirée' }
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', invitation.group_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    redirect(`/groups/${invitation.group_id}`)
  }

  // Add as member
  await supabase.from('group_members').insert({
    group_id: invitation.group_id,
    user_id: user.id,
    role: 'member',
  })

  // Mark invitation as accepted
  await serviceSupabase
    .from('group_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id)

  revalidatePath('/')
  redirect(`/groups/${invitation.group_id}`)
}
```

- [ ] **Step 2: Group settings page**

Create `app/(app)/groups/[id]/settings/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { createInvitation } from '@/lib/server/invitations'
import { deleteGroup } from '@/lib/server/groups'
import Link from 'next/link'

export default function GroupSettingsPage({ params }: { params: { id: string } }) {
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerateLink() {
    const link = await createInvitation(params.id)
    setInviteLink(link)
  }

  async function handleCopy() {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const deleteWithId = deleteGroup.bind(null, params.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/groups/${params.id}`} className="text-slate-400 hover:text-white">←</Link>
        <h1 className="text-2xl font-bold">Paramètres du groupe</h1>
      </div>

      <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold">Inviter quelqu'un</h2>
        <p className="text-slate-400 text-sm">Génère un lien unique valable 7 jours.</p>
        <button
          onClick={handleGenerateLink}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-xl transition"
        >
          Générer un lien d'invitation
        </button>
        {inviteLink && (
          <div className="space-y-2">
            <input
              readOnly
              value={inviteLink}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-300"
            />
            <button
              onClick={handleCopy}
              className="w-full border border-slate-600 hover:border-slate-500 text-sm py-2.5 rounded-xl transition"
            >
              {copied ? '✓ Copié !' : 'Copier le lien'}
            </button>
          </div>
        )}
      </section>

      <section className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-red-400">Zone dangereuse</h2>
        <form action={deleteWithId}>
          <button
            type="submit"
            className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 font-medium py-3 rounded-xl transition"
          >
            Supprimer le groupe
          </button>
        </form>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Accept invitation page**

Create `app/invite/[token]/page.tsx`:

```typescript
import { acceptInvitation } from '@/lib/server/invitations'

export default async function InvitePage({ params }: { params: { token: string } }) {
  const result = await acceptInvitation(params.token)

  if (result?.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-4xl">😕</p>
          <p className="text-xl font-semibold">{result.error}</p>
          <a href="/" className="text-violet-400 hover:underline">Retour à l'accueil</a>
        </div>
      </div>
    )
  }

  return null // redirect happens in server action
}
```

- [ ] **Step 4: Test manually**

- Go to group settings → generate invite link
- Open link in incognito / another browser → should prompt login then join group
- Reuse the same link → should say "already member" or redirect

- [ ] **Step 5: Commit**

```bash
git add lib/server/invitations.ts app/\(app\)/groups/ app/invite/
git commit -m "feat: add group sharing via single-use invite links"
```

---

## Task 13: Email Notifications (Cron)

**Files:**
- Create: `emails/DailyReminder.tsx`
- Create: `app/api/cron/notifications/route.ts`

- [ ] **Step 1: Email template**

Create `emails/DailyReminder.tsx`:

```typescript
interface Props {
  userName: string
  actions: { groupName: string; actionName: string; label: string; emoji: string | null }[]
  appUrl: string
}

export function DailyReminderEmail({ userName, actions, appUrl }: Props) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Be Better — Rappels du jour</title></head>
<body style="font-family:sans-serif;background:#0f172a;color:#f1f5f9;padding:40px 20px;max-width:480px;margin:0 auto">
  <h1 style="color:#a78bfa;font-size:24px;margin-bottom:4px">Be Better</h1>
  <p style="color:#94a3b8;margin-top:0">Bonjour ${userName} 👋</p>
  <p style="color:#cbd5e1">Voici tes actions à ne pas oublier aujourd'hui :</p>

  ${actions.map(a => `
  <div style="background:#1e293b;border-radius:12px;padding:16px;margin-bottom:12px">
    <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">${a.groupName}</p>
    <p style="margin:8px 0 4px;font-size:16px;font-weight:600">${a.emoji ?? ''} ${a.actionName}</p>
    <p style="margin:0;font-size:13px;color:#f97316">${a.label}</p>
  </div>
  `).join('')}

  <a href="${appUrl}" style="display:block;background:#7c3aed;color:white;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-weight:600;margin-top:24px">
    Ouvrir Be Better
  </a>

  <p style="color:#475569;font-size:12px;text-align:center;margin-top:24px">
    Be Better — deviens la meilleure version de toi-même
  </p>
</body>
</html>
  `.trim()
}
```

- [ ] **Step 2: Cron route**

Create `app/api/cron/notifications/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { computeActionStatus } from '@/lib/utils/status'
import { Resend } from 'resend'
import { DailyReminderEmail } from '@/emails/DailyReminder'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  // Fetch all actions with their group info
  const { data: actions } = await supabase
    .from('actions')
    .select('*, groups(name)')

  if (!actions?.length) return NextResponse.json({ sent: 0 })

  // Fetch all completions for these actions
  const { data: allCompletions } = await supabase
    .from('action_completions')
    .select('*')
    .in('action_id', actions.map(a => a.id))
    .order('completed_at', { ascending: false })

  // Fetch all group members to know who to notify
  const { data: members } = await supabase
    .from('group_members')
    .select('*, users(id, email, name)')
    .in('group_id', [...new Set(actions.map(a => a.group_id))])

  // Build per-user notification list
  const userNotifications: Record<string, {
    user: { id: string; email: string; name: string | null }
    items: { groupName: string; actionName: string; label: string; emoji: string | null }[]
  }> = {}

  for (const action of actions) {
    const group = (action as any).groups
    const actionCompletions = (allCompletions ?? []).filter(c => c.action_id === action.id)
    const groupMembers = (members ?? []).filter(m => m.group_id === action.group_id)

    if (action.sync_mode === 'shared') {
      const lastCompletion = actionCompletions[0] ?? null
      const { status, label, nextDue } = computeActionStatus(
        action,
        lastCompletion ? new Date(lastCompletion.completed_at) : null,
        now
      )
      if (nextDue && nextDue <= in24h || status === 'overdue') {
        for (const member of groupMembers) {
          const user = (member as any).users
          if (!user?.email) continue
          if (!userNotifications[user.id]) userNotifications[user.id] = { user, items: [] }
          userNotifications[user.id].items.push({
            groupName: group?.name ?? '',
            actionName: action.name,
            label,
            emoji: action.emoji,
          })
        }
      }
    } else {
      // individual: compute per user
      for (const member of groupMembers) {
        const user = (member as any).users
        if (!user?.email) continue
        const lastCompletion = actionCompletions.find(c => c.user_id === user.id) ?? null
        const { status, label, nextDue } = computeActionStatus(
          action,
          lastCompletion ? new Date(lastCompletion.completed_at) : null,
          now
        )
        if (nextDue && nextDue <= in24h || status === 'overdue') {
          if (!userNotifications[user.id]) userNotifications[user.id] = { user, items: [] }
          userNotifications[user.id].items.push({
            groupName: group?.name ?? '',
            actionName: action.name,
            label,
            emoji: action.emoji,
          })
        }
      }
    }
  }

  // Send emails
  let sent = 0
  for (const { user, items } of Object.values(userNotifications)) {
    if (!items.length) continue
    await resend.emails.send({
      from: 'Be Better <rappels@yourdomain.com>',
      to: user.email,
      subject: `${items.length} action${items.length > 1 ? 's' : ''} à faire aujourd'hui`,
      html: DailyReminderEmail({
        userName: user.name ?? user.email,
        actions: items,
        appUrl: process.env.NEXT_PUBLIC_APP_URL!,
      }),
    })
    sent++
  }

  return NextResponse.json({ sent })
}
```

- [ ] **Step 3: Configure Vercel Cron**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "0 8 * * *"
    }
  ]
}
```

This runs the cron daily at 8am UTC.

- [ ] **Step 4: Test cron manually**

```bash
curl -H "Authorization: Bearer your_cron_secret" http://localhost:3000/api/cron/notifications
```
Expected: `{"sent": 0}` (no due actions yet) — no error

- [ ] **Step 5: Commit**

```bash
git add emails/ app/api/ vercel.json
git commit -m "feat: add daily email notifications via Resend cron"
```

---

## Task 14: User Settings Page

**Files:**
- Create: `app/(app)/settings/page.tsx`

- [ ] **Step 1: Settings page**

Create `app/(app)/settings/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Pending invitations for groups I own
  const { data: pendingInvitations } = await supabase
    .from('group_invitations')
    .select('*, groups(name)')
    .eq('invited_by', user!.id)
    .eq('status', 'pending')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-slate-400 hover:text-white">←</Link>
        <h1 className="text-2xl font-bold">Paramètres</h1>
      </div>

      <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold">Mon profil</h2>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-lg font-bold">
            {(profile?.name ?? user?.email ?? '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{profile?.name ?? 'Sans nom'}</p>
            <p className="text-slate-400 text-sm">{user?.email}</p>
          </div>
        </div>
      </section>

      {pendingInvitations && pendingInvitations.length > 0 && (
        <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3">
          <h2 className="font-semibold">Invitations en attente</h2>
          {pendingInvitations.map((inv: any) => (
            <div key={inv.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{inv.groups?.name}</span>
              <span className="text-orange-400">En attente</span>
            </div>
          ))}
        </section>
      )}

      <form action={signOut}>
        <button
          type="submit"
          className="w-full border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white font-medium py-3 rounded-xl transition"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
npm run test:run
```
Expected: All tests PASS

- [ ] **Step 3: Full manual smoke test**

- Login → create group → add 3 actions (1 relative, 1 fixed, 1 shared)
- Validate each action → encouragement toast appears
- Return to home → group card shows correct status badges
- Go to group settings → generate invite link → open in incognito → join
- Check group shows both members

- [ ] **Step 4: Final commit**

```bash
git add app/\(app\)/settings/
git commit -m "feat: add user settings and sign out"
```

---

## Task 15: Deploy to Vercel

- [ ] **Step 1: Push all changes to GitHub**

```bash
git push origin feat/spec-review-fixes
```
Merge the PR, then:
```bash
git checkout master && git pull
```

- [ ] **Step 2: Import project in Vercel**

Go to vercel.com → New Project → Import `lPadoue/be-better`

- [ ] **Step 3: Set environment variables in Vercel**

In Vercel project settings → Environment Variables, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL` (= your Vercel URL, e.g. `https://be-better.vercel.app`)

- [ ] **Step 4: Update OAuth redirect URLs**

In Supabase Dashboard → Auth → URL Configuration:
- Site URL: `https://be-better.vercel.app`
- Add redirect URL: `https://be-better.vercel.app/auth/callback`

In Google Cloud Console and Apple Developer, add the same callback URL.

- [ ] **Step 5: Trigger deploy**

```bash
git commit --allow-empty -m "chore: trigger vercel deploy" && git push
```

- [ ] **Step 6: Smoke test production**

Open your Vercel URL → login → create group → add action → validate → confirm toast works in production.

---

## Summary

| Task | What it builds |
|---|---|
| 1 | Next.js project scaffolding |
| 2 | TypeScript types |
| 3 | Supabase schema + RLS + seed |
| 4 | Recurrence utils (TDD) |
| 5 | Status utils (TDD) |
| 6 | Supabase client + auth middleware |
| 7 | Login page (email + Google + Apple) |
| 8 | App layout + home page |
| 9 | Group creation + GroupCard |
| 10 | Action creation + group detail page |
| 11 | ActionCard + completion toast |
| 12 | Group sharing via invite links |
| 13 | Daily email notifications |
| 14 | User settings |
| 15 | Deploy to Vercel |
