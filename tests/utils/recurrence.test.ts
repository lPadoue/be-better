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
