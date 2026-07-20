import 'server-only'

import { getZohoTransporter } from '@/lib/email/zoho'

export async function sendFeedbackNotification(message: string): Promise<void> {
  const fromEmail = process.env.ZOHO_SMTP_USER
  const toEmail = process.env.FEEDBACK_NOTIFICATION_EMAIL

  if (!fromEmail || !toEmail) {
    console.error('Feedback notification email skipped: ZOHO_SMTP_USER or FEEDBACK_NOTIFICATION_EMAIL not configured')
    return
  }

  try {
    const transporter = getZohoTransporter()
    await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: 'Yeni bir geri bildirim alındı',
      text: message,
      html: `<p>Yeni bir geri bildirim alındı:</p><p>${escapeHtml(message)}</p>`
    })
  } catch (error) {
    console.error('Feedback notification email failed:', error)
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
