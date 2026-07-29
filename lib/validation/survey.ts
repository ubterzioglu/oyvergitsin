import { z } from 'zod'

export const CreateSessionSchema = z.object({
  isGuest: z.boolean().optional().default(true)
})

export const SubmitAnswersSchema = z.object({
  sessionId: z.string().uuid(),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        value: z.string().min(1).max(500),
        // Kullanıcının "bu konu benim için önemli" işareti; eksen ağırlığını
        // 1'den 1,5'e çıkarır. Eski istemciler bu alanı göndermez.
        isImportant: z.boolean().optional().default(false)
      })
    )
    .min(1)
    .max(200)
})

export const CompleteSessionSchema = z.object({
  sessionId: z.string().uuid()
})
