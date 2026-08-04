import { z } from 'zod'

export const SiyasetRadariScanSchema = z.object({
  source: z.enum(['all', 'tbmm', 'journalists']).default('all'),
})

export const SiyasetRadariReviewSchema = z.object({
  subjectTable: z.enum([
    'public_people',
    'political_affiliation_events',
    'journalist_status_events',
    'public_data_evidence',
    'election_results_by_area',
  ]),
  subjectId: z.string().uuid(),
  action: z.enum(['approve', 'reject', 'archive']),
  note: z.string().max(1000).optional(),
})

export const PublicPeopleQuerySchema = z.object({
  role: z.enum(['politician', 'journalist', 'both']).optional(),
  province: z.string().max(100).optional(),
  q: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const ProvinceQuerySchema = z.object({
  province: z.string().max(100).optional(),
  electionType: z.string().max(60).optional(),
})

export const ManualPoliticalSwitchSchema = z.object({
  fullName: z.string().min(2).max(200),
  fromPartyName: z.string().max(200).optional(),
  toPartyName: z.string().max(200).optional(),
  province: z.string().max(100).optional(),
  happenedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  summary: z.string().max(1000).optional(),
  sourceName: z.string().min(2).max(200),
  sourceUrl: z.string().url(),
  xHandle: z.string().max(80).optional(),
})
