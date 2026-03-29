import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/supabase/dal'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function SettingsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: pendingInvitations } = await supabase
    .from('group_invitations')
    .select('*, groups(name)')
    .eq('invited_by', user.id)
    .eq('status', 'pending')

  const initial = (profile?.name ?? user?.email ?? '?')[0].toUpperCase()
  const isGuest = user.is_anonymous === true

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-[#8C7E72] hover:text-[#F2EAE0] transition-colors">←</Link>
        <h1 className="font-[family-name:var(--font-serif)] text-2xl text-[#F2EAE0] tracking-tight">Paramètres</h1>
      </div>

      <section className="bg-[#161310] border border-[#2C2620] rounded-2xl p-5 space-y-4">
        <h2 className="text-xs text-[#8C7E72] uppercase tracking-widest font-medium">Mon profil</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#2E1F05] border border-[#E8A44A]/30 flex items-center justify-center text-lg font-semibold text-[#E8A44A] shrink-0">
            {isGuest ? '?' : initial}
          </div>
          <div>
            <p className="font-medium text-[#F2EAE0]">
              {isGuest ? 'Mode invité' : (profile?.name ?? 'Sans nom')}
            </p>
            <p className="text-[#8C7E72] text-sm">
              {isGuest ? 'Données locales · non synchronisées' : (user?.email ?? '')}
            </p>
          </div>
        </div>
        {isGuest && (
          <Link
            href="/login"
            className="block w-full bg-[#2E1F05] hover:bg-[#3A2608] text-[#E8A44A] border border-[#E8A44A]/20 hover:border-[#E8A44A]/40 font-medium py-3 rounded-xl transition-all duration-200 text-center text-sm"
          >
            Créer un compte pour sauvegarder
          </Link>
        )}
      </section>

      {pendingInvitations && pendingInvitations.length > 0 && (
        <section className="bg-[#161310] border border-[#2C2620] rounded-2xl p-5 space-y-3">
          <h2 className="text-xs text-[#8C7E72] uppercase tracking-widest font-medium">Invitations en attente</h2>
          {pendingInvitations.map((inv: any) => (
            <div key={inv.id} className="flex items-center justify-between">
              <span className="text-[#F2EAE0] text-sm">{(inv.groups as any)?.name}</span>
              <span className="bg-[#2A1505] text-[#CC7A3A] text-xs px-2.5 py-1 rounded-full">En attente</span>
            </div>
          ))}
        </section>
      )}

      <form action={signOut}>
        <button
          type="submit"
          className="w-full border border-[#2C2620] hover:border-[#3C3228] text-[#8C7E72] hover:text-[#F2EAE0] font-medium py-3.5 rounded-xl transition-all duration-200 text-sm"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  )
}
