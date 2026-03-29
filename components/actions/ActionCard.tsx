'use client'

import { useState, useCallback, useTransition } from 'react'
import { completeAction } from '@/lib/server/completions'
import { computeActionStatus } from '@/lib/utils/status'
import CompletionToast from './CompletionToast'
import type { Action, ActionCompletion } from '@/types/database'

const STATUS_STYLES = {
  overdue: {
    bar: 'bg-[#B85555]',
    text: 'text-[#B85555]',
    border: 'border-[#B85555]/20',
    bg: 'bg-[#2A0A0A]',
  },
  warning: {
    bar: 'bg-[#CC7A3A]',
    text: 'text-[#CC7A3A]',
    border: 'border-[#CC7A3A]/20',
    bg: 'bg-[#2A1505]',
  },
  ok: {
    bar: 'bg-[#5A9966]',
    text: 'text-[#5A9966]',
    border: 'border-[#2C2620]',
    bg: 'bg-[#161310]',
  },
  never_done: {
    bar: 'bg-[#4A3F37]',
    text: 'text-[#8C7E72]',
    border: 'border-[#2C2620]',
    bg: 'bg-[#161310]',
  },
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
  const { status, progress, label } = computeActionStatus(action, effectiveDate)

  const styles = STATUS_STYLES[status]

  function handleDone() {
    startTransition(async () => {
      setLocalCompletion(new Date())
      const p = await completeAction(action.id, groupId)
      setPhrase(p)
    })
  }

  const handleToastDone = useCallback(() => setPhrase(null), [])

  return (
    <>
      {phrase && <CompletionToast phrase={phrase} onDone={handleToastDone} />}

      <div className={`${styles.bg} border ${styles.border} rounded-2xl p-4 transition-all duration-200`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1E1A16] flex items-center justify-center text-lg shrink-0">
            {action.emoji ?? '✓'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#F2EAE0] truncate text-sm">{action.name}</p>
            <p className={`text-xs mt-0.5 ${styles.text}`}>{label}</p>

            <div className="mt-2.5 h-1 bg-[#2C2620] rounded-full overflow-hidden">
              <div
                className={`h-full ${styles.bar} rounded-full transition-all duration-700`}
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleDone}
            disabled={isPending}
            className="shrink-0 bg-[#1E1A16] hover:bg-[#2E1F05] border border-[#2C2620] hover:border-[#E8A44A]/40 disabled:opacity-50 text-[#E8A44A] font-semibold px-3.5 py-2 rounded-xl text-xs transition-all duration-200"
          >
            {isPending ? '…' : '✓ Fait'}
          </button>
        </div>

        {action.sync_mode === 'shared' && baseCompletion && (
          <p className="text-xs text-[#4A3F37] mt-2.5 pl-12">
            Dernière fois : {new Date(baseCompletion.completed_at).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>
    </>
  )
}
