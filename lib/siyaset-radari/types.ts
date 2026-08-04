export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'archived'
export type Visibility = 'private' | 'public'
export type SourceConfidence = 'official' | 'high' | 'standard' | 'low'

export interface PublicPerson {
  id: string
  slug: string
  full_name: string
  primary_role: 'politician' | 'journalist' | 'both'
  province: string | null
  electoral_district: string | null
  bio: string | null
  x_handle: string | null
  review_status: ReviewStatus
  visibility: Visibility
  last_verified_at: string | null
  created_at: string
  updated_at: string
}

export interface PoliticalAffiliationEvent {
  id: string
  person_id: string
  event_type: 'elected' | 'party_join' | 'party_leave' | 'party_switch' | 'independent' | 'party_rename' | 'other'
  from_party_name: string | null
  to_party_name: string | null
  province: string | null
  electoral_district: string | null
  happened_on: string | null
  summary: string | null
  source_name: string
  source_url: string
  source_confidence: SourceConfidence
  review_status: ReviewStatus
  visibility: Visibility
  last_verified_at: string | null
  created_at: string
  updated_at: string
}

export interface JournalistStatusEvent {
  id: string
  person_id: string
  outlet: string | null
  job_title: string | null
  status: 'detained' | 'imprisoned' | 'convicted' | 'released' | 'unknown'
  status_label: string
  started_on: string | null
  ended_on: string | null
  summary: string | null
  source_name: string
  source_url: string
  source_confidence: SourceConfidence
  review_status: ReviewStatus
  visibility: Visibility
  last_verified_at: string | null
  created_at: string
  updated_at: string
}

export interface ElectionResultByArea {
  id: string
  election_year: number
  election_type: string
  area_level: 'country' | 'province' | 'district' | 'electoral_district'
  area_name: string
  province: string | null
  electoral_district: string | null
  party_name: string
  vote_count: number | null
  vote_share: number | null
  seat_count: number | null
  source_name: string
  source_url: string
  source_confidence: SourceConfidence
  review_status: ReviewStatus
  visibility: Visibility
  last_verified_at: string | null
  created_at: string
  updated_at: string
}

export interface ParsedSeatDistribution {
  partyName: string
  seatCount: number
}

export interface ParsedJournalistStatus {
  fullName: string
  outlet: string | null
  jobTitle: string | null
  status: 'imprisoned'
  statusLabel: string
}

export interface ParsedElectionResult {
  electionYear: number
  electionType: string
  areaLevel: 'country' | 'province' | 'district' | 'electoral_district'
  areaName: string
  province?: string | null
  electoralDistrict?: string | null
  partyName: string
  voteCount?: number | null
  voteShare?: number | null
  seatCount?: number | null
}

export interface ScanOutcome {
  source: string
  fetched: number
  inserted: number
  updated: number
  skipped: number
  failed: boolean
  errorMessage: string | null
}

export interface SiyasetRadariScanSummary {
  status: 'completed' | 'partial' | 'failed'
  outcomes: ScanOutcome[]
}
