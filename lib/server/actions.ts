'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function ensureUserRow(supabase: Awaited<ReturnType<typeof createClient>>, user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) {
  await supabase.from('users').upsert({
    id: user.id,
    email: user.email ?? null,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
  }, { onConflict: 'id', ignoreDuplicates: true })
}

export async function createAction(groupId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await ensureUserRow(supabase, user)

  const recurrenceType = formData.get('recurrence_type') as 'relative' | 'fixed'

  const actionData: Record<string, unknown> = {
    group_id: groupId,
    name: formData.get('name') as string,
    emoji: formData.get('emoji') as string || null,
    recurrence_type: recurrenceType,
    sync_mode: formData.get('sync_mode') as 'shared' | 'individual',
  }

  if (recurrenceType === 'relative') {
    actionData.recurrence_value = parseInt(formData.get('recurrence_value') as string)
    actionData.recurrence_unit = formData.get('recurrence_unit') as string
  } else {
    actionData.fixed_month = parseInt(formData.get('fixed_month') as string)
    actionData.fixed_day = parseInt(formData.get('fixed_day') as string)
  }

  const { error } = await supabase.from('actions').insert(actionData)
  if (error) throw error
  revalidatePath(`/groups/${groupId}`)
}

export async function deleteAction(actionId: string, groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('actions')
    .delete()
    .eq('id', actionId)
    .eq('group_id', groupId)

  if (error) throw error
  revalidatePath(`/groups/${groupId}`)
}
