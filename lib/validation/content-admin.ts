import { z } from 'zod'

// supabase/migrations/009 içindeki party_position_evidence_source_type_check ile aynı sıra (kanıt hiyerarşisi).
export const EVIDENCE_SOURCE_TYPES = [
  'secim_beyannamesi',
  'parti_programi',
  'resmi_aciklama',
  'tbmm_davranis',
  'uzman_veri',
  'turetilmis',
] as const

export const EVIDENCE_SOURCE_LABELS: Record<(typeof EVIDENCE_SOURCE_TYPES)[number], string> = {
  secim_beyannamesi: 'Seçim beyannamesi',
  parti_programi: 'Parti programı',
  resmi_aciklama: 'Resmî açıklama',
  tbmm_davranis: 'TBMM oy/davranış',
  uzman_veri: 'Uzman verisi',
  turetilmis: 'Türetilmiş',
}

const MIN_RATIONALE_LENGTH = 20

// 2026-02-31 gibi biçimce doğru ama takvimde olmayan tarihleri ayıklar.
function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional()
    .transform((value) => value ?? null)

export const EvidenceItemSchema = z.object({
  source_type: z.enum(EVIDENCE_SOURCE_TYPES),
  source_title: z.string().trim().min(3, 'Kaynak başlığı gerekli.').max(300),
  source_url: z
    .string()
    .trim()
    .max(2000)
    .url('Geçerli bir bağlantı girin.')
    .refine((value) => value.startsWith('https://'), 'Bağlantı https:// ile başlamalı.')
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  source_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-AA-GG biçiminde olmalı.')
    .refine(isRealDate, 'Geçerli bir tarih girin.')
    .refine((value) => value <= todayIso(), 'Kaynak tarihi ileri bir tarih olamaz.')
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  quote: optionalText(2000),
  rationale: z
    .string()
    .trim()
    .min(MIN_RATIONALE_LENGTH, `Gerekçe en az ${MIN_RATIONALE_LENGTH} karakter olmalı.`)
    .max(4000),
})

export const PublishPositionSchema = z.object({
  partyId: z.string().uuid(),
  axisId: z.string().uuid(),
  // Sunucudan gelen değer olduğu gibi geri gönderilir (mikrosaniye hassasiyeti korunmalı).
  expectedUpdatedAt: z.string().min(1).nullable(),
  score: z.number().int().min(-100).max(100),
  evidence: z.array(EvidenceItemSchema).min(1, 'En az bir kanıt gerekli.').max(20),
  note: z.string().trim().max(1000).optional(),
  publicNote: z.string().trim().max(500).optional(),
  isPublic: z.boolean().default(true),
})

export const VerifyPositionSchema = z.object({
  positionId: z.string().uuid(),
  note: z.string().trim().max(1000).optional(),
})

export type EvidenceItemInput = z.infer<typeof EvidenceItemSchema>
export type PublishPositionInput = z.infer<typeof PublishPositionSchema>
