import { acceptInvitation } from '@/lib/server/invitations'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const result = await acceptInvitation(token)

  if (result?.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-4xl">😕</p>
          <p className="text-xl font-semibold">{result.error}</p>
          <a href="/" className="text-violet-400 hover:underline">Retour à l'accueil</a>
        </div>
      </div>
    )
  }

  return null
}
