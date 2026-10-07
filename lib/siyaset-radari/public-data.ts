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

export interface DashboardFeedItem {
  id: string
  topic: string
  title: string
  description: string | null
  sourceName: string
  sourceUrl: string | null
  articleUrl: string
  publishedAt: string | null
  discoveredAt: string
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

function personFromRow(row: Record<string, unknown>): DashboardPerson {
  return {
    id: row.id as string,
    slug: row.slug as string,
    fullName: row.full_name as string,
    primaryRole: row.primary_role as string,
    province: row.province as string | null,
    xHandle: row.x_handle as string | null,
    lastVerifiedAt: row.last_verified_at as string | null,
  }
}

function politicalEventFromRow(row: Record<string, unknown>): DashboardPoliticalEvent {
  const person = (row.public_people ?? {}) as Record<string, unknown>
  return {
    id: row.id as string,
    personId: row.person_id as string,
    personSlug: (person.slug as string) ?? '',
    fullName: (person.full_name as string) ?? 'Bilinmeyen kişi',
    eventType: row.event_type as string,
    fromPartyName: row.from_party_name as string | null,
    toPartyName: row.to_party_name as string | null,
    province: row.province as string | null,
    happenedOn: row.happened_on as string | null,
    summary: row.summary as string | null,
    sourceName: row.source_name as string,
    sourceUrl: row.source_url as string,
    lastVerifiedAt: row.last_verified_at as string | null,
  }
}

function journalistEventFromRow(row: Record<string, unknown>): DashboardJournalistEvent {
  const person = (row.public_people ?? {}) as Record<string, unknown>
  return {
    id: row.id as string,
    personId: row.person_id as string,
    personSlug: (person.slug as string) ?? '',
    fullName: (person.full_name as string) ?? 'Bilinmeyen kişi',
    outlet: row.outlet as string | null,
    jobTitle: row.job_title as string | null,
    status: row.status as string,
    statusLabel: row.status_label as string,
    sourceName: row.source_name as string,
    sourceUrl: row.source_url as string,
    lastVerifiedAt: row.last_verified_at as string | null,
    isStale: isJournalistStatusStale(row.last_verified_at as string | null),
  }
}

function electionResultFromRow(row: Record<string, unknown>): DashboardElectionResult {
  return {
    id: row.id as string,
    electionYear: row.election_year as number,
    electionType: row.election_type as string,
    areaLevel: row.area_level as string,
    areaName: row.area_name as string,
    province: row.province as string | null,
    partyName: row.party_name as string,
    voteShare: row.vote_share === null ? null : Number(row.vote_share),
    seatCount: row.seat_count as number | null,
    sourceName: row.source_name as string,
    sourceUrl: row.source_url as string,
    lastVerifiedAt: row.last_verified_at as string | null,
    isStale: isParliamentSnapshotStale(row.last_verified_at as string | null),
  }
}

function feedItemFromRow(row: Record<string, unknown>): DashboardFeedItem {
  return {
    id: row.id as string,
    topic: row.topic as string,
    title: row.title as string,
    description: row.description as string | null,
    sourceName: row.source_name as string,
    sourceUrl: row.source_url as string | null,
    articleUrl: row.article_url as string,
    publishedAt: row.published_at as string | null,
    discoveredAt: row.discovered_at as string,
  }
}

export async function fetchSiyasetRadariDashboard() {
  const supabase = getPublicServerClient()
  const [peopleResult, politicalResult, journalistsResult, electionResult, feedResult] = await Promise.all([
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
    supabase
      .from('radar_feed_items')
      .select('id, topic, title, description, source_name, source_url, article_url, published_at, discovered_at')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('discovered_at', { ascending: false })
      .limit(60),
  ])

  if (peopleResult.error) console.error('Siyaset radari people error:', peopleResult.error)
  if (politicalResult.error) console.error('Siyaset radari political error:', politicalResult.error)
  if (journalistsResult.error) console.error('Siyaset radari journalists error:', journalistsResult.error)
  if (electionResult.error) console.error('Siyaset radari election error:', electionResult.error)
  if (feedResult.error) console.error('Siyaset radari feed error:', feedResult.error)

  return {
    people: ((peopleResult.data ?? []) as Record<string, unknown>[]).map(personFromRow),
    politicalEvents: ((politicalResult.data ?? []) as Record<string, unknown>[]).map(politicalEventFromRow),
    journalistEvents: ((journalistsResult.data ?? []) as Record<string, unknown>[]).map(journalistEventFromRow),
    electionResults: ((electionResult.data ?? []) as Record<string, unknown>[]).map(electionResultFromRow),
    feedItems: ((feedResult.data ?? []) as Record<string, unknown>[]).map(feedItemFromRow),
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
  return ((data ?? []) as Record<string, unknown>[]).map(personFromRow)
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
    ...personFromRow(person as Record<string, unknown>),
    bio: person.bio as string | null,
    politicalEvents: ((politicalResult.data ?? []) as Record<string, unknown>[]).map(politicalEventFromRow),
    journalistEvents: ((journalistResult.data ?? []) as Record<string, unknown>[]).map(journalistEventFromRow),
    evidence: ((evidenceResult.data ?? []) as Record<string, unknown>[]).map((row) => ({
      id: row.id as string,
      sourceType: row.source_type as string,
      sourceName: row.source_name as string,
      sourceUrl: row.source_url as string,
      title: row.title as string | null,
      excerpt: row.excerpt as string | null,
      publishedAt: row.published_at as string | null,
      capturedAt: row.captured_at as string,
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

export async function fetchApprovedFeedItems() {
  const { feedItems } = await fetchSiyasetRadariDashboard()
  return feedItems
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
  return ((data ?? []) as Record<string, unknown>[]).map(electionResultFromRow)
}
