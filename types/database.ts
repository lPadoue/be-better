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
