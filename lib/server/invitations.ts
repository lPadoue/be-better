'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createInvitation(groupId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const db = await createServiceClient()
  const { data, error } = await db
    .from('group_invitations')
    .insert({ group_id: groupId, invited_by: user.id })
    .select('token')
    .single()

  if (error) throw error

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return `${origin}/invite/${data.token}`
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/invite/${token}`)

  const db = await createServiceClient()

  const { data: invitation } = await db
    .from('group_invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (!invitation) return { error: 'Invitation invalide ou expirée' }
  if (new Date(invitation.expires_at) < new Date()) {
    await db.from('group_invitations').update({ status: 'expired' }).eq('id', invitation.id)
    return { error: 'Invitation expirée' }
  }

  const { data: existing } = await db
    .from('group_members')
    .select('user_id')
    .eq('group_id', invitation.group_id)
    .eq('user_id', user.id)
    .single()

  if (existing) redirect(`/groups/${invitation.group_id}`)

  const { error: memberError } = await db.from('group_members').insert({
    group_id: invitation.group_id,
    user_id: user.id,
    role: 'member',
  })
  if (memberError) throw memberError

  await db.from('group_invitations').update({ status: 'accepted' }).eq('id', invitation.id)

  revalidatePath('/')
  redirect(`/groups/${invitation.group_id}`)
}
