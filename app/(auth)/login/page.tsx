'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const callbackUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    : `/auth/callback?next=${encodeURIComponent(next)}`

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl },
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
      options: { redirectTo: callbackUrl },
    })
  }

  async function signInWithApple() {
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: callbackUrl },
    })
  }

  async function signInAsGuest() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInAnonymously()
    if (error) {
      setError('Erreur lors de la connexion invité.')
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0B09] flex items-center justify-center p-6">
      {/* Subtle radial glow */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#E8A44A]/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-sm relative animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2E1F05] border border-[#E8A44A]/20 mb-5">
            <span className="text-2xl">✦</span>
          </div>
          <h1 className="font-[family-name:var(--font-serif)] text-4xl text-[#F2EAE0] tracking-tight">Be Better</h1>
          <p className="text-[#8C7E72] text-sm mt-2">La meilleure version de toi commence ici</p>
        </div>

        {sent ? (
          <div className="bg-[#1E1A16] border border-[#2C2620] rounded-2xl p-6 text-center space-y-2">
            <div className="text-3xl mb-3">📬</div>
            <p className="font-medium text-[#F2EAE0]">Vérifie ton email !</p>
            <p className="text-[#8C7E72] text-sm">Lien envoyé à <span className="text-[#E8A44A]">{email}</span></p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* OAuth buttons */}
            <button
              onClick={signInWithGoogle}
              className="w-full bg-[#1E1A16] hover:bg-[#252019] border border-[#2C2620] hover:border-[#3C3228] text-[#F2EAE0] font-medium py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </button>

            <button
              onClick={signInWithApple}
              className="w-full bg-[#1E1A16] hover:bg-[#252019] border border-[#2C2620] hover:border-[#3C3228] text-[#F2EAE0] font-medium py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 814 1000" fill="currentColor">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.3-148.2-99.3C27 439.9 6 285.4 6 178.3 6 80.6 54.4 25.2 98.7 25.2c38.9 0 67 27.1 91.9 27.1 24.8 0 59.2-28.7 96.3-28.7 30.7 0 108 25.9 140.9 84.6zm-218-190.5c-20.8 24.4-53.9 44.6-86.1 44.6-3.2 0-6.4-.3-9.6-.8-1-3.2-1.3-6.7-1.3-10.3 0-22.9 9.7-48 28.7-67.5 19.4-19.9 53.5-35.2 82.4-36.5.9 3.6 1.3 7.3 1.3 11 0 22.6-8.7 45.7-15.4 59.5z"/>
              </svg>
              Continuer avec Apple
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-[#2C2620]" />
              <span className="text-[#4A3F37] text-xs uppercase tracking-widest">ou</span>
              <div className="flex-1 h-px bg-[#2C2620]" />
            </div>

            {/* Email form */}
            <form onSubmit={signInWithEmail} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-[#8C7E72] block font-medium uppercase tracking-widest">Adresse email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="prenom@exemple.com"
                  required
                  className="w-full bg-[#1E1A16] border border-[#2C2620] text-[#F2EAE0] placeholder:text-[#4A3F37] rounded-xl py-3.5 px-4 focus:outline-none focus:border-[#E8A44A] focus:ring-1 focus:ring-[#E8A44A]/30 transition-all duration-200 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E8A44A] hover:bg-[#F0B55E] disabled:opacity-50 text-[#0D0B09] font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 text-sm"
              >
                {loading ? 'Envoi…' : 'Recevoir un lien magique'}
              </button>
              {error && (
                <p className="text-[#B85555] text-sm text-center">{error}</p>
              )}
            </form>

            {/* Guest */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#1E1A16]" />
            </div>
            <button
              onClick={signInAsGuest}
              disabled={loading}
              className="w-full border border-[#2C2620] hover:border-[#3C3228] text-[#8C7E72] hover:text-[#F2EAE0] font-medium py-3 px-4 rounded-xl transition-all duration-200 text-sm disabled:opacity-50"
            >
              Continuer sans compte
            </button>
            <p className="text-[#4A3F37] text-xs text-center">
              Accès limité · partage désactivé · données liées à cet appareil
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D0B09]" />}>
      <LoginForm />
    </Suspense>
  )
}
