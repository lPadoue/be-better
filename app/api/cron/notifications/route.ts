import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { computeActionStatus } from '@/lib/utils/status'
import { DailyReminderEmail } from '@/emails/DailyReminder'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = await createServiceClient()
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const { data: actions } = await supabase
    .from('actions')
    .select('*, groups(name)')

  if (!actions?.length) return NextResponse.json({ sent: 0 })

  const { data: allCompletions } = await supabase
    .from('action_completions')
    .select('*')
    .in('action_id', actions.map(a => a.id))
    .order('completed_at', { ascending: false })

  const { data: members } = await supabase
    .from('group_members')
    .select('*, users(id, email, name)')
    .in('group_id', [...new Set(actions.map(a => a.group_id))])

  const userNotifications: Record<string, {
    user: { id: string; email: string; name: string | null }
    items: { groupName: string; actionName: string; label: string; emoji: string | null }[]
  }> = {}

  for (const action of actions) {
    const group = (action as any).groups
    const actionCompletions = (allCompletions ?? []).filter(c => c.action_id === action.id)
    const groupMembers = (members ?? []).filter(m => m.group_id === action.group_id)

    if (action.sync_mode === 'shared') {
      const lastCompletion = actionCompletions[0] ?? null
      const { status, label, nextDue } = computeActionStatus(
        action,
        lastCompletion ? new Date(lastCompletion.completed_at) : null,
        now
      )
      if ((nextDue && nextDue <= in24h) || status === 'overdue') {
        for (const member of groupMembers) {
          const user = (member as any).users
          if (!user?.email) continue
          if (!userNotifications[user.id]) userNotifications[user.id] = { user, items: [] }
          userNotifications[user.id].items.push({
            groupName: group?.name ?? '',
            actionName: action.name,
            label,
            emoji: action.emoji,
          })
        }
      }
    } else {
      for (const member of groupMembers) {
        const user = (member as any).users
        if (!user?.email) continue
        const lastCompletion = actionCompletions.find(c => c.user_id === user.id) ?? null
        const { status, label, nextDue } = computeActionStatus(
          action,
          lastCompletion ? new Date(lastCompletion.completed_at) : null,
          now
        )
        if ((nextDue && nextDue <= in24h) || status === 'overdue') {
          if (!userNotifications[user.id]) userNotifications[user.id] = { user, items: [] }
          userNotifications[user.id].items.push({
            groupName: group?.name ?? '',
            actionName: action.name,
            label,
            emoji: action.emoji,
          })
        }
      }
    }
  }

  let sent = 0
  for (const { user, items } of Object.values(userNotifications)) {
    if (!items.length) continue
    const { error: sendError } = await resend.emails.send({
      from: 'Be Better <rappels@yourdomain.com>',
      to: user.email,
      subject: `${items.length} action${items.length > 1 ? 's' : ''} à faire aujourd'hui`,
      html: DailyReminderEmail({
        userName: user.name ?? user.email,
        actions: items,
        appUrl: process.env.NEXT_PUBLIC_APP_URL!,
      }),
    })
    if (!sendError) sent++
  }

  return NextResponse.json({ sent })
}
