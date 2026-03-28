import { getUser } from '@/lib/supabase/dal'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  if (!user) redirect('/login')

  const isGuest = user.is_anonymous === true

  return (
    <div className="min-h-screen flex flex-col">
      {isGuest && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-sm text-amber-400">
          Mode invité · les données sont liées à cet appareil ·{' '}
          <Link href="/login" className="underline hover:text-amber-300">
            Créer un compte
          </Link>{' '}
          pour sauvegarder et partager
        </div>
      )}
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-violet-400">Be Better</Link>
        {isGuest ? (
          <Link href="/login" className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm" title="Créer un compte">
            👤
          </Link>
        ) : (
          <Link href="/settings" className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm">
            {user.email?.[0].toUpperCase()}
          </Link>
        )}
      </header>
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
