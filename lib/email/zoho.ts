import 'server-only'

import nodemailer, { type Transporter } from 'nodemailer'

let cachedTransporter: Transporter | null = null

export function getZohoTransporter(): Transporter {
  if (cachedTransporter) {
    return cachedTransporter
  }

  const user = process.env.ZOHO_SMTP_USER
  const pass = process.env.ZOHO_SMTP_PASSWORD

  if (!user || !pass) {
    throw new Error('ZOHO_SMTP_USER or ZOHO_SMTP_PASSWORD is not configured')
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.eu',
    port: 465,
    secure: true,
    auth: { user, pass }
  })

  return cachedTransporter
}
