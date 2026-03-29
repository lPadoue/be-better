import CreateGroupForm from '@/components/groups/CreateGroupForm'
import Link from 'next/link'

export default function NewGroupPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-[#8C7E72] hover:text-[#F2EAE0] transition-colors">←</Link>
        <h1 className="font-[family-name:var(--font-serif)] text-2xl text-[#F2EAE0] tracking-tight">Nouveau groupe</h1>
      </div>
      <CreateGroupForm />
    </div>
  )
}
