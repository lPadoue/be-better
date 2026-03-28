import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ActionCard from '@/components/actions/ActionCard'
import type { Action } from '@/types/database'

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
        groupId="g1"
      />
    )
    expect(screen.getByText('✓ Fait')).toBeInTheDocument()
  })
})
