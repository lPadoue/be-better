interface Props {
  userName: string
  actions: { groupName: string; actionName: string; label: string; emoji: string | null }[]
  appUrl: string
}

export function DailyReminderEmail({ userName, actions, appUrl }: Props) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Be Better — Rappels du jour</title></head>
<body style="font-family:sans-serif;background:#0f172a;color:#f1f5f9;padding:40px 20px;max-width:480px;margin:0 auto">
  <h1 style="color:#a78bfa;font-size:24px;margin-bottom:4px">Be Better</h1>
  <p style="color:#94a3b8;margin-top:0">Bonjour ${userName} 👋</p>
  <p style="color:#cbd5e1">Voici tes actions à ne pas oublier aujourd'hui :</p>

  ${actions.map(a => `
  <div style="background:#1e293b;border-radius:12px;padding:16px;margin-bottom:12px">
    <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">${a.groupName}</p>
    <p style="margin:8px 0 4px;font-size:16px;font-weight:600">${a.emoji ?? ''} ${a.actionName}</p>
    <p style="margin:0;font-size:13px;color:#f97316">${a.label}</p>
  </div>
  `).join('')}

  <a href="${appUrl}" style="display:block;background:#7c3aed;color:white;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-weight:600;margin-top:24px">
    Ouvrir Be Better
  </a>

  <p style="color:#475569;font-size:12px;text-align:center;margin-top:24px">
    Be Better — deviens la meilleure version de toi-même
  </p>
</body>
</html>
  `.trim()
}
