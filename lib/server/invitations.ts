'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createInvitation(groupId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('group_invitations')
    .insert({ group_id: groupId, invited_by: user.id })
    .select('token')
    .single()

  if (error) throw error
  return `${process.env.NEXT_PUBLIC_APP_URL}/invite/${data.token}`
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/invite/${token}`)

  const { data: invitation } = await serviceSupabase
    .from('group_invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (!invitation) return { error: 'Invitation invalide ou expirée' }
  if (new Date(invitation.expires_at) < new Date()) {
    await serviceSupabase
      .from('group_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id)
    return { error: 'Invitation expirée' }
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', invitation.group_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    redirect(`/groups/${invitation.group_id}`)
  }

  const { error: memberError } = await supabase.from('group_members').insert({
    group_id: invitation.group_id,
    user_id: user.id,
    role: 'member',
  })
  if (memberError) throw memberError

  await serviceSupabase
    .from('group_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id)

  revalidatePath('/')
  redirect(`/groups/${invitation.group_id}`)
}
