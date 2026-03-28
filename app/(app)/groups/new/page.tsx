import CreateGroupForm from '@/components/groups/CreateGroupForm'
import Link from 'next/link'

export default function NewGroupPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-slate-400 hover:text-white">←</Link>
        <h1 className="text-2xl font-bold">Nouveau groupe</h1>
      </div>
      <CreateGroupForm />
    </div>
  )
}
