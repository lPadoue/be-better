import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-violet-400">Be Better</Link>
        <Link href="/settings" className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm">
          {user.email?.[0].toUpperCase()}
        </Link>
      </header>
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
