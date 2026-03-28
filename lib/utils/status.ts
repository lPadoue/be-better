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
