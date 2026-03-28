import { addHours, addDays, addWeeks, addMonths } from 'date-fns'
import type { RecurrenceUnit } from '@/types/database'

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
  return Math.max(1, Math.floor(totalDays * 0.2))
}
