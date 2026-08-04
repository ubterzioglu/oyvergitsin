import { getPublicServerClient } from '@/lib/supabase/route'
import { isJournalistStatusStale, isParliamentSnapshotStale } from './stale'

export interface DashboardPerson {
  id: string
  slug: string
  fullName: string
  primaryRole: string
  province: string | null
  xHandle: string | null
  lastVerifiedAt: string | null
}

export interface DashboardPoliticalEvent {
  id: string
  personId: string
  personSlug: string
  fullName: string
  eventType: string
  fromPartyName: string | null
  toPartyName: string | null
  province: string | null
  happenedOn: string | null
  summary: string | null
  sourceName: string
  sourceUrl: string
  lastVerifiedAt: string | null
}

export interface DashboardJournalistEvent {
  id: string
  personId: string
  personSlug: string
  fullName: string
  outlet: string | null
  jobTitle: string | null
  status: string
  statusLabel: string
  sourceName: string
  sourceUrl: string
  lastVerifiedAt: string | null
  isStale: boolean
}

export interface DashboardElectionResult {
  id: string
  electionYear: number
  electionType: string
  areaLevel: string
  areaName: string
  province: string | null
  partyName: string
  voteShare: number | null
  seatCount: number | null
  sourceName: string
  sourceUrl: string
  lastVerifiedAt: string | null
  isStale: boolean
}

export interface PersonDetail extends DashboardPerson {
  bio: string | null
  politicalEvents: DashboardPoliticalEvent[]
  journalistEvents: DashboardJournalistEvent[]
  evidence: Array<{
    id: string
    sourceType: string
    sourceName: string
    sourceUrl: string
    title: string | null
    excerpt: string | null
    publishedAt: string | null
    capturedAt: string
  }>
}

function personFromRow(row: any): DashboardPerson {
  return {
    id: row.id,
    slug: row.slug,
    fullName: row.full_name,
    primaryRole: row.primary_role,
    province: row.province,
    xHandle: row.x_handle,
    lastVerifiedAt: row.last_verified_at,
  }
}

function politicalEventFromRow(row: any): DashboardPoliticalEvent {
  const person = row.public_people ?? {}
  return {
    id: row.id,
    personId: row.person_id,
    personSlug: person.slug ?? '',
    fullName: person.full_name ?? 'Bilinmeyen kişi',
    eventType: row.event_type,
    fromPartyName: row.from_party_name,
    toPartyName: row.to_party_name,
    province: row.province,
    happenedOn: row.happened_on,
    summary: row.summary,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    lastVerifiedAt: row.last_verified_at,
  }
}

function journalistEventFromRow(row: any): DashboardJournalistEvent {
  const person = row.public_people ?? {}
  return {
    id: row.id,
    personId: row.person_id,
    personSlug: person.slug ?? '',
    fullName: person.full_name ?? 'Bilinmeyen kişi',
    outlet: row.outlet,
    jobTitle: row.job_title,
    status: row.status,
    statusLabel: row.status_label,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    lastVerifiedAt: row.last_verified_at,
    isStale: isJournalistStatusStale(row.last_verified_at),
  }
}

function electionResultFromRow(row: any): DashboardElectionResult {
  return {
    id: row.id,
    electionYear: row.election_year,
    electionType: row.election_type,
    areaLevel: row.area_level,
    areaName: row.area_name,
    province: row.province,
    partyName: row.party_name,
    voteShare: row.vote_share === null ? null : Number(row.vote_share),
    seatCount: row.seat_count,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    lastVerifiedAt: row.last_verified_at,
    isStale: isParliamentSnapshotStale(row.last_verified_at),
  }
}

export async function fetchSiyasetRadariDashboard() {
  const supabase = getPublicServerClient()
  const [peopleResult, politicalResult, journalistsResult, electionResult] = await Promise.all([
    supabase
      .from('public_people')
      .select('id, slug, full_name, primary_role, province, x_handle, last_verified_at')
      .order('full_name', { ascending: true })
      .limit(100),
    supabase
      .from('political_affiliation_events')
      .select('id, person_id, event_type, from_party_name, to_party_name, province, happened_on, summary, source_name, source_url, last_verified_at, public_people(slug, full_name)')
      .order('happened_on', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('journalist_status_events')
      .select('id, person_id, outlet, job_title, status, status_label, source_name, source_url, last_verified_at, public_people(slug, full_name)')
      .order('last_verified_at', { ascending: false, nullsFirst: false })
      .limit(100),
    supabase
      .from('election_results_by_area')
      .select('id, election_year, election_type, area_level, area_name, province, party_name, vote_share, seat_count, source_name, source_url, last_verified_at')
      .order('seat_count', { ascending: false, nullsFirst: false })
      .limit(200),
  ])

  if (peopleResult.error) console.error('Siyaset radari people error:', peopleResult.error)
  if (politicalResult.error) console.error('Siyaset radari political error:', politicalResult.error)
  if (journalistsResult.error) console.error('Siyaset radari journalists error:', journalistsResult.error)
  if (electionResult.error) console.error('Siyaset radari election error:', electionResult.error)

  return {
    people: ((peopleResult.data ?? []) as any[]).map(personFromRow),
    politicalEvents: ((politicalResult.data ?? []) as any[]).map(politicalEventFromRow),
    journalistEvents: ((journalistsResult.data ?? []) as any[]).map(journalistEventFromRow),
    electionResults: ((electionResult.data ?? []) as any[]).map(electionResultFromRow),
  }
}

export async function fetchPublicPeople(params: { role?: string; province?: string; q?: string; limit?: number }) {
  const supabase = getPublicServerClient()
  let query = supabase
    .from('public_people')
    .select('id, slug, full_name, primary_role, province, x_handle, last_verified_at')
    .order('full_name', { ascending: true })
    .limit(params.limit ?? 50)

  if (params.role) {
    query = query.eq('primary_role', params.role)
  }
  if (params.province) {
    query = query.eq('province', params.province)
  }
  if (params.q) {
    query = query.ilike('full_name', `%${params.q}%`)
  }

  const { data, error } = await query
  if (error) {
    throw error
  }
  return ((data ?? []) as any[]).map(personFromRow)
}

export async function fetchPersonDetail(slug: string): Promise<PersonDetail | null> {
  const supabase = getPublicServerClient()
  const { data: person, error } = await supabase
    .from('public_people')
    .select('id, slug, full_name, primary_role, province, electoral_district, bio, x_handle, last_verified_at')
    .eq('slug', slug)
    .single()

  if (error || !person) {
    return null
  }

  const [politicalResult, journalistResult, evidenceResult] = await Promise.all([
    supabase
      .from('political_affiliation_events')
      .select('id, person_id, event_type, from_party_name, to_party_name, province, happened_on, summary, source_name, source_url, last_verified_at, public_people(slug, full_name)')
      .eq('person_id', person.id)
      .order('happened_on', { ascending: false, nullsFirst: false }),
    supabase
      .from('journalist_status_events')
      .select('id, person_id, outlet, job_title, status, status_label, source_name, source_url, last_verified_at, public_people(slug, full_name)')
      .eq('person_id', person.id)
      .order('last_verified_at', { ascending: false, nullsFirst: false }),
    supabase
      .from('public_data_evidence')
      .select('id, source_type, source_name, source_url, title, excerpt, published_at, captured_at')
      .eq('person_id', person.id)
      .order('captured_at', { ascending: false })
      .limit(50),
  ])

  return {
    ...personFromRow(person),
    bio: person.bio,
    politicalEvents: ((politicalResult.data ?? []) as any[]).map(politicalEventFromRow),
    journalistEvents: ((journalistResult.data ?? []) as any[]).map(journalistEventFromRow),
    evidence: ((evidenceResult.data ?? []) as any[]).map((row) => ({
      id: row.id,
      sourceType: row.source_type,
      sourceName: row.source_name,
      sourceUrl: row.source_url,
      title: row.title,
      excerpt: row.excerpt,
      publishedAt: row.published_at,
      capturedAt: row.captured_at,
    })),
  }
}

export async function fetchApprovedPoliticalEvents() {
  const { politicalEvents } = await fetchSiyasetRadariDashboard()
  return politicalEvents
}

export async function fetchApprovedJournalistEvents() {
  const { journalistEvents } = await fetchSiyasetRadariDashboard()
  return journalistEvents
}

export async function fetchApprovedProvinceResults(params: { province?: string; electionType?: string }) {
  const supabase = getPublicServerClient()
  let query = supabase
    .from('election_results_by_area')
    .select('id, election_year, election_type, area_level, area_name, province, party_name, vote_share, seat_count, source_name, source_url, last_verified_at')
    .order('seat_count', { ascending: false, nullsFirst: false })

  if (params.province) {
    query = query.eq('province', params.province)
  }
  if (params.electionType) {
    query = query.eq('election_type', params.electionType)
  }

  const { data, error } = await query.limit(200)
  if (error) {
    throw error
  }
  return ((data ?? []) as any[]).map(electionResultFromRow)
}
