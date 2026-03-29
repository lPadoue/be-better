'use client'

import { useState, useEffect } from 'react'
import { createInvitation } from '@/lib/server/invitations'
import { deleteGroup } from '@/lib/server/groups'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { use } from 'react'

export default function GroupSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setIsGuest(data.user?.is_anonymous ?? false)
    })
  }, [])

  async function handleGenerateLink() {
    try {
      const link = await createInvitation(id)
      setInviteLink(link)
    } catch {
      alert('Vous devez être propriétaire du groupe pour inviter des membres.')
    }
  }

  async function handleCopy() {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const deleteWithId = deleteGroup.bind(null, id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/groups/${id}`} className="text-[#8C7E72] hover:text-[#F2EAE0] transition-colors">←</Link>
        <h1 className="font-[family-name:var(--font-serif)] text-2xl text-[#F2EAE0] tracking-tight">Paramètres</h1>
      </div>

      {isGuest ? (
        <section className="bg-[#161310] border border-[#2C2620] rounded-2xl p-5 space-y-3">
          <h2 className="font-medium text-[#F2EAE0]">Inviter quelqu'un</h2>
          <p className="text-[#8C7E72] text-sm">Le partage est disponible avec un compte.</p>
          <Link
            href="/login"
            className="block w-full bg-[#2E1F05] hover:bg-[#3A2608] text-[#E8A44A] border border-[#E8A44A]/20 hover:border-[#E8A44A]/40 font-medium py-3 rounded-xl transition-all duration-200 text-center text-sm"
          >
            Créer un compte pour inviter
          </Link>
        </section>
      ) : (
        <section className="bg-[#161310] border border-[#2C2620] rounded-2xl p-5 space-y-3">
          <h2 className="font-medium text-[#F2EAE0]">Inviter quelqu'un</h2>
          <p className="text-[#8C7E72] text-sm">Génère un lien unique valable 7 jours.</p>
          <button
            onClick={handleGenerateLink}
            className="w-full bg-[#E8A44A] hover:bg-[#F0B55E] text-[#0D0B09] font-semibold py-3 rounded-xl transition-all duration-200 text-sm"
          >
            Générer un lien d'invitation
          </button>
          {inviteLink && (
            <div className="space-y-2">
              <input
                readOnly
                value={inviteLink}
                className="w-full bg-[#1E1A16] border border-[#2C2620] text-[#8C7E72] rounded-xl py-2.5 px-3 text-xs focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="w-full border border-[#2C2620] hover:border-[#3C3228] text-[#8C7E72] hover:text-[#F2EAE0] text-sm py-2.5 rounded-xl transition-all duration-200"
              >
                {copied ? '✓ Copié !' : 'Copier le lien'}
              </button>
            </div>
          )}
        </section>
      )}

      <section className="bg-[#2A0A0A] border border-[#B85555]/20 rounded-2xl p-5 space-y-3">
        <h2 className="font-medium text-[#B85555]">Zone dangereuse</h2>
        <form action={deleteWithId}>
          <button
            type="submit"
            className="w-full bg-transparent hover:bg-[#B85555]/10 text-[#B85555] border border-[#B85555]/30 hover:border-[#B85555]/50 font-medium py-3 rounded-xl transition-all duration-200 text-sm"
          >
            Supprimer le groupe
          </button>
        </form>
      </section>
    </div>
  )
}
