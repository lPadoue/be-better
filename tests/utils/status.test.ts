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
    const now = new Date('2026-04-01')
    const result = computeActionStatus(fixedAction, null, now)
    expect(result.status).toBe('never_done')
  })

  it('returns ok when done this year and next occurrence is far', () => {
    const lastCompletion = new Date('2026-03-14')
    const now = new Date('2026-03-16')
    const result = computeActionStatus(fixedAction, lastCompletion, now)
    expect(result.status).toBe('ok')
  })

  it('returns warning when within 7 days of fixed date', () => {
    const lastCompletion = new Date('2026-03-14')
    const now = new Date('2027-03-10')
    const result = computeActionStatus(fixedAction, lastCompletion, now)
    expect(result.status).toBe('warning')
  })
})

describe('formatLabel branches', () => {
  it('returns "Demain" when due tomorrow', () => {
    const lastCompletion = new Date('2026-03-01')
    const now = new Date('2026-03-07') // nextDue = March 8, exactly 1 day away
    const result = computeActionStatus(relativeAction, lastCompletion, now)
    expect(result.label).toBe('Demain')
  })

  it('returns "Dans Xj" when due in multiple days', () => {
    const lastCompletion = new Date('2026-03-01')
    const now = new Date('2026-03-03') // nextDue = March 8, 5 days away
    const result = computeActionStatus(relativeAction, lastCompletion, now)
    expect(result.label).toBe('Dans 5j')
  })

  it('returns "En retard" when overdue same day', () => {
    const lastCompletion = new Date('2026-03-01')
    const now = new Date('2026-03-08T12:00:00') // same day as nextDue but hours after
    const result = computeActionStatus(relativeAction, lastCompletion, now)
    expect(result.label).toBe('En retard')
  })
})
