'use client'

import { useState } from 'react'
import { createInvitation } from '@/lib/server/invitations'
import { deleteGroup } from '@/lib/server/groups'
import Link from 'next/link'
import { use } from 'react'

export default function GroupSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerateLink() {
    const link = await createInvitation(id)
    setInviteLink(link)
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
        <Link href={`/groups/${id}`} className="text-slate-400 hover:text-white">←</Link>
        <h1 className="text-2xl font-bold">Paramètres du groupe</h1>
      </div>

      <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold">Inviter quelqu'un</h2>
        <p className="text-slate-400 text-sm">Génère un lien unique valable 7 jours.</p>
        <button
          onClick={handleGenerateLink}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-xl transition"
        >
          Générer un lien d'invitation
        </button>
        {inviteLink && (
          <div className="space-y-2">
            <input
              readOnly
              value={inviteLink}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-300"
            />
            <button
              onClick={handleCopy}
              className="w-full border border-slate-600 hover:border-slate-500 text-sm py-2.5 rounded-xl transition"
            >
              {copied ? '✓ Copié !' : 'Copier le lien'}
            </button>
          </div>
        )}
      </section>

      <section className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-red-400">Zone dangereuse</h2>
        <form action={deleteWithId}>
          <button
            type="submit"
            className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 font-medium py-3 rounded-xl transition"
          >
            Supprimer le groupe
          </button>
        </form>
      </section>
    </div>
  )
}
