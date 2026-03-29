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
        <div className="bg-[#161310] border border-[#2C2620] hover:border-[#3C3228] rounded-2xl p-4 transition-all duration-200 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E1A16] flex items-center justify-center text-xl shrink-0">
              {group.emoji ?? '📋'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#F2EAE0] truncate">{group.name}</p>
              <p className="text-[#4A3F37] text-xs mt-0.5">Aucune action</p>
            </div>
            <span className="text-[#4A3F37] group-hover:text-[#8C7E72] transition-colors text-lg">›</span>
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
    .limit(100)

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

  const total = actions.length
  const okCount = statusCounts.ok + statusCounts.never_done

  return (
    <Link href={`/groups/${group.id}`}>
      <div className="bg-[#161310] border border-[#2C2620] hover:border-[#3C3228] rounded-2xl p-4 transition-all duration-200 group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E1A16] flex items-center justify-center text-xl shrink-0">
            {group.emoji ?? '📋'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#F2EAE0] truncate">{group.name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-[#8C7E72] text-xs">{total} action{total !== 1 ? 's' : ''}</p>
              {statusCounts.overdue > 0 && (
                <span className="bg-[#2A0A0A] text-[#B85555] text-xs px-2 py-0.5 rounded-full">
                  {statusCounts.overdue} en retard
                </span>
              )}
              {statusCounts.warning > 0 && (
                <span className="bg-[#2A1505] text-[#CC7A3A] text-xs px-2 py-0.5 rounded-full">
                  {statusCounts.warning} bientôt
                </span>
              )}
              {statusCounts.overdue === 0 && statusCounts.warning === 0 && okCount > 0 && (
                <span className="bg-[#0D2410] text-[#5A9966] text-xs px-2 py-0.5 rounded-full">
                  ✓ À jour
                </span>
              )}
            </div>
          </div>
          <span className="text-[#4A3F37] group-hover:text-[#8C7E72] transition-colors text-lg">›</span>
        </div>
      </div>
    </Link>
  )
}
