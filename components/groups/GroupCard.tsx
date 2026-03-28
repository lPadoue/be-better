import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { computeActionStatus } from '@/lib/utils/status'
import type { Group } from '@/types/database'

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
