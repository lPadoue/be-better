'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeAction(actionId: string, groupId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const db = await createServiceClient()

  await db.from('action_completions').insert({
    action_id: actionId,
    user_id: user.id,
  })

  const { data: encouragements } = await db
    .from('encouragements')
    .select('text')
    .eq('status', 'active')

  const pool = encouragements ?? []
  const phrase = pool.length > 0
    ? pool[Math.floor(Math.random() * pool.length)].text
    : 'Bien joué ! ✨'

  revalidatePath(`/groups/${groupId}`)
  return phrase
}
