import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CreateActionForm from '@/components/actions/CreateActionForm'
import ActionCard from '@/components/actions/ActionCard'
import { getUser } from '@/lib/supabase/dal'

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const user = await getUser()

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()

  if (!group) notFound()

  const { data: actions } = await supabase
    .from('actions')
    .select('*')
    .eq('group_id', id)
    .order('created_at')

  const actionIds = actions?.map(a => a.id) ?? []
  const { data: completions } = actionIds.length
    ? await supabase
        .from('action_completions')
        .select('*')
        .in('action_id', actionIds)
        .order('completed_at', { ascending: false })
    : { data: [] }

  const isOwner = group.owner_id === user!.id

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-slate-400 hover:text-white">←</Link>
        <span className="text-2xl">{group.emoji ?? '📋'}</span>
        <h1 className="text-2xl font-bold flex-1">{group.name}</h1>
        {isOwner && (
          <Link href={`/groups/${id}/settings`} className="text-slate-400 hover:text-white text-sm">
            ⚙️
          </Link>
        )}
      </div>

      {group.description && (
        <p className="text-slate-400 text-sm">{group.description}</p>
      )}

      <div className="space-y-3">
        {(actions ?? []).map(action => {
          const allCompletions = (completions ?? []).filter(c => c.action_id === action.id)
          const lastShared = allCompletions[0] ?? null
          const lastMine = allCompletions.find(c => c.user_id === user!.id) ?? null
          return (
            <ActionCard
              key={action.id}
              action={action}
              lastSharedCompletion={lastShared}
              lastUserCompletion={lastMine}
              currentUserId={user!.id}
              groupId={id}
            />
          )
        })}
      </div>

      <CreateActionForm groupId={id} />
    </div>
  )
}
