'use client'

import type { Action, ActionCompletion } from '@/types/database'

interface Props {
  action: Action
  lastSharedCompletion: ActionCompletion | null
  lastUserCompletion: ActionCompletion | null
  currentUserId: string
  groupId: string
}

export default function ActionCard(_props: Props) {
  return null
}
