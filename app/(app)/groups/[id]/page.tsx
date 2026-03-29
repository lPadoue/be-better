import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import CreateActionForm from '@/components/actions/CreateActionForm'
import ActionCard from '@/components/actions/ActionCard'
import { getUser } from '@/lib/supabase/dal'

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/login')

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
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-[#8C7E72] hover:text-[#F2EAE0] transition-colors">←</Link>
        <div className="w-10 h-10 rounded-xl bg-[#1E1A16] flex items-center justify-center text-xl shrink-0">
          {group.emoji ?? '📋'}
        </div>
        <h1 className="font-[family-name:var(--font-serif)] text-2xl text-[#F2EAE0] tracking-tight flex-1">{group.name}</h1>
        {isOwner && (
          <Link
            href={`/groups/${id}/settings`}
            className="w-8 h-8 rounded-lg bg-[#1E1A16] border border-[#2C2620] hover:border-[#3C3228] flex items-center justify-center text-[#8C7E72] hover:text-[#F2EAE0] transition-all duration-200 text-sm"
          >
            ⚙
          </Link>
        )}
      </div>

      {group.description && (
        <p className="text-[#8C7E72] text-sm pl-1">{group.description}</p>
      )}

      <div className="space-y-2.5">
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
              groupId={id}
            />
          )
        })}
      </div>

      <CreateActionForm groupId={id} />
    </div>
  )
}
