'use client'

import { useState, useCallback, useTransition } from 'react'
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
  groupId: string
}

export default function ActionCard({
  action, lastSharedCompletion, lastUserCompletion, groupId
}: Props) {
  const [phrase, setPhrase] = useState<string | null>(null)
  const [localCompletion, setLocalCompletion] = useState<Date | null>(null)
  const [isPending, startTransition] = useTransition()

  const baseCompletion = action.sync_mode === 'shared' ? lastSharedCompletion : lastUserCompletion
  const effectiveDate = localCompletion ?? (baseCompletion ? new Date(baseCompletion.completed_at) : null)
  const { status, progress, label } = computeActionStatus(
    action,
    effectiveDate
  )

  const styles = STATUS_STYLES[status]

  function handleDone() {
    startTransition(async () => {
      const now = new Date()
      setLocalCompletion(now)
      const p = await completeAction(action.id, groupId)
      setPhrase(p)
    })
  }

  const handleToastDone = useCallback(() => setPhrase(null), [])

  return (
    <>
      {phrase && <CompletionToast phrase={phrase} onDone={handleToastDone} />}

      <div className={`bg-slate-800/50 border ${styles.border} rounded-2xl p-4`}>
        <div className="flex items-center gap-3">
          <span className="text-xl shrink-0">{action.emoji ?? '✓'}</span>

          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{action.name}</p>
            <p className={`text-xs mt-0.5 ${styles.text}`}>{label}</p>

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

        {action.sync_mode === 'shared' && baseCompletion && (
          <p className="text-xs text-slate-500 mt-2 pl-8">
            Dernière fois : {new Date(baseCompletion.completed_at).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>
    </>
  )
}
