'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    })
    if (error) {
      setError('Erreur lors de l\'envoi. Vérifie ton adresse email.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    })
  }

  async function signInWithApple() {
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Be Better</h1>
          <p className="text-slate-400 mt-2">Deviens la meilleure version de toi-même</p>
        </div>

        {sent ? (
          <div className="bg-slate-800 rounded-2xl p-6 text-center">
            <p className="text-lg">📬 Vérifie ton email !</p>
            <p className="text-slate-400 text-sm mt-2">Lien de connexion envoyé à {email}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={signInWithGoogle}
              className="w-full bg-white text-slate-900 font-medium py-3 px-4 rounded-xl hover:bg-slate-100 transition flex items-center justify-center gap-2"
            >
              <span>🌐</span> Continuer avec Google
            </button>
            <button
              onClick={signInWithApple}
              className="w-full bg-slate-800 text-white font-medium py-3 px-4 rounded-xl hover:bg-slate-700 transition flex items-center justify-center gap-2 border border-slate-700"
            >
              <span>🍎</span> Continuer avec Apple
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-slate-950 px-2 text-slate-500">ou par email</span>
              </div>
            </div>

            <form onSubmit={signInWithEmail} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ton@email.com"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-4 rounded-xl transition disabled:opacity-50"
              >
                {loading ? 'Envoi...' : 'Recevoir un lien magique'}
              </button>
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
