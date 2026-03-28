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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-slate-400 hover:text-white">←</Link>
        <h1 className="text-2xl font-bold">Paramètres</h1>
      </div>

      <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold">Mon profil</h2>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-lg font-bold">
            {(profile?.name ?? user?.email ?? '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{profile?.name ?? 'Sans nom'}</p>
            <p className="text-slate-400 text-sm">{user?.email}</p>
          </div>
        </div>
      </section>

      {pendingInvitations && pendingInvitations.length > 0 && (
        <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3">
          <h2 className="font-semibold">Invitations en attente</h2>
          {pendingInvitations.map((inv: any) => (
            <div key={inv.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{(inv.groups as any)?.name}</span>
              <span className="text-orange-400">En attente</span>
            </div>
          ))}
        </section>
      )}

      <form action={signOut}>
        <button
          type="submit"
          className="w-full border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white font-medium py-3 rounded-xl transition"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  )
}
