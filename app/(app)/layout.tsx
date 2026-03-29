import { getUser } from '@/lib/supabase/dal'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const isGuest = user.is_anonymous === true
  const initial = user.email?.[0]?.toUpperCase() ?? '✦'

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0B09]">
      {isGuest && (
        <div className="bg-[#2E1F05] border-b border-[#E8A44A]/20 px-4 py-2 text-center text-xs text-[#E8A44A]/80">
          Mode invité · données liées à cet appareil ·{' '}
          <Link href="/login" className="underline hover:text-[#E8A44A] transition-colors">
            Créer un compte
          </Link>{' '}
          pour sauvegarder et partager
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-[#1E1A16] bg-[#0D0B09]/90 backdrop-blur-md px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-serif)] text-xl text-[#E8A44A] tracking-tight">
            Be Better
          </Link>
          {isGuest ? (
            <Link
              href="/login"
              className="text-xs text-[#8C7E72] hover:text-[#E8A44A] border border-[#2C2620] hover:border-[#E8A44A]/40 px-3 py-1.5 rounded-lg transition-all duration-200"
            >
              Se connecter
            </Link>
          ) : (
            <Link href="/settings" className="w-8 h-8 rounded-full bg-[#2E1F05] border border-[#E8A44A]/30 flex items-center justify-center text-sm font-semibold text-[#E8A44A] hover:border-[#E8A44A]/60 transition-colors">
              {initial}
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
