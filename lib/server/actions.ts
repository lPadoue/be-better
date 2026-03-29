'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAction(groupId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const db = await createServiceClient()
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

  const { error } = await db.from('actions').insert(actionData)
  if (error) throw error
  revalidatePath(`/groups/${groupId}`)
}

export async function deleteAction(actionId: string, groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const db = await createServiceClient()
  const { error } = await db
    .from('actions')
    .delete()
    .eq('id', actionId)
    .eq('group_id', groupId)

  if (error) throw error
  revalidatePath(`/groups/${groupId}`)
}
