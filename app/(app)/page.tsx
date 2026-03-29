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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-2xl text-[#F2EAE0] tracking-tight">Mes groupes</h1>
          <p className="text-[#8C7E72] text-xs mt-0.5">{groups.length} groupe{groups.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/groups/new"
          className="bg-[#E8A44A] hover:bg-[#F0B55E] text-[#0D0B09] px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
        >
          + Nouveau
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1E1A16] border border-[#2C2620] mb-5">
            <span className="text-3xl">🌱</span>
          </div>
          <p className="font-medium text-[#F2EAE0]">Aucun groupe encore</p>
          <p className="text-sm text-[#8C7E72] mt-1">Crée ton premier groupe pour commencer</p>
          <Link
            href="/groups/new"
            className="inline-block mt-5 bg-[#E8A44A] hover:bg-[#F0B55E] text-[#0D0B09] px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          >
            Créer un groupe
          </Link>
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
