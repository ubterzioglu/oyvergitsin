import { z } from 'zod'

export const ManualScanSchema = z.object({
  sourceIds: z.array(z.string().uuid()).max(100).optional()
})

export const CandidateActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'duplicate']),
  duplicateOfId: z.string().uuid().optional(),
  note: z.string().max(1000).optional()
})

export type CandidateAction = z.infer<typeof CandidateActionSchema>
