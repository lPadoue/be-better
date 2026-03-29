'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createGroup(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const db = await createServiceClient()

  await db.from('users').upsert({
    id: user.id,
    email: user.email ?? null,
    name: (user.user_metadata?.full_name as string | null) ?? (user.user_metadata?.name as string | null) ?? null,
    avatar_url: (user.user_metadata?.avatar_url as string | null) ?? null,
  }, { onConflict: 'id', ignoreDuplicates: true })

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const emoji = formData.get('emoji') as string | null

  const { data: group, error } = await db
    .from('groups')
    .insert({ name, description, emoji, owner_id: user.id })
    .select()
    .single()

  if (error) throw error

  const { error: memberError } = await db.from('group_members').insert({
    group_id: group.id,
    user_id: user.id,
    role: 'owner',
  })
  if (memberError) throw memberError

  revalidatePath('/')
  redirect(`/groups/${group.id}`)
}

export async function deleteGroup(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const db = await createServiceClient()
  await db.from('groups').delete().eq('id', groupId).eq('owner_id', user.id)
  revalidatePath('/')
  redirect('/')
}
