import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/dal'
import type { Group } from '@/types/database'
import Link from 'next/link'
import GroupCard from '@/components/groups/GroupCard'

export default async function HomePage() {
  const user = await getUser()
  const supabase = await createClient()

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, role, groups(*)')
    .eq('user_id', user!.id)

  const groups = memberships?.map(m => m.groups).filter(Boolean) as unknown as Group[] ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes groupes</h1>
        <Link
          href="/groups/new"
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          + Nouveau
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-4">🌱</p>
          <p className="font-medium">Aucun groupe encore</p>
          <p className="text-sm mt-1">Crée ton premier groupe pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(group => (
            <GroupCard key={group.id} group={group} userId={user!.id} />
          ))}
        </div>
      )}
    </div>
  )
}
