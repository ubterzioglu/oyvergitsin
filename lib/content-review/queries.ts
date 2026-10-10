import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { getActiveAxisModelId } from '@/lib/scoring/active-model'
import type { EvidenceItem } from './position-diff'
import {
  buildReviewQueue,
  type AdminAxis,
  type AdminParty,
  type AdminPosition,
  type PositionMatrix,
} from './review-queue'

export type { AdminAxis, AdminParty, AdminPosition, PositionMatrix, ReviewQueue, StalePositionItem } from './review-queue'
export { buildReviewQueue } from './review-queue'

export interface ChangeLogEntry {
  id: string
  action: string
  changes: Record<string, unknown>
  note: string | null
  publicNote: string | null
  isPublic: boolean
  createdAt: string
}

function partyFromRow(row: Record<string, unknown>): AdminParty {
  return {
    id: row.id as string,
    name: (row.display_name as string | null) ?? (row.name as string),
    shortName: row.short_name as string | null,
    color: (row.color as string | null) ?? '#999999',
    isActive: row.is_active !== false,
    matchStatus: row.match_status as string | null,
    registryStatus: row.registry_status as string | null,
    registryCheckedAt: row.registry_checked_at as string | null,
  }
}

function positionFromRow(row: Record<string, unknown>): AdminPosition {
  return {
    id: row.id as string,
    partyId: row.party_id as string,
    axisId: row.axis_id as string,
    score: row.score as number,
    updatedAt: row.updated_at as string | null,
    lastVerifiedAt: row.last_verified_at as string | null,
  }
}

/** Aktif eksen modelindeki parti × eksen pozisyon matrisi. */
export async function getPositionMatrix(client: SupabaseClient): Promise<PositionMatrix> {
  const axisModelId = await getActiveAxisModelId(client)
  if (!axisModelId) {
    return { axisModelId: null, parties: [], axes: [], positions: [] }
  }

  const [partiesRes, axesRes] = await Promise.all([
    client.from('parties').select('*').order('name', { ascending: true }),
    client
      .from('axes')
      .select('id, name, slug, order_index')
      .eq('axis_model_id', axisModelId)
      .order('order_index', { ascending: true }),
  ])
  if (partiesRes.error) throw partiesRes.error
  if (axesRes.error) throw axesRes.error

  const axes: AdminAxis[] = (axesRes.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    orderIndex: row.order_index as number,
  }))

  let positions: AdminPosition[] = []
  if (axes.length > 0) {
    const { data, error } = await client
      .from('party_positions')
      .select('id, party_id, axis_id, score, updated_at, last_verified_at')
      .in(
        'axis_id',
        axes.map((axis) => axis.id)
      )
    if (error) throw error
    positions = (data ?? []).map(positionFromRow)
  }

  return {
    axisModelId,
    parties: (partiesRes.data ?? []).map(partyFromRow),
    axes,
    positions,
  }
}

export async function getReviewQueueCount(client: SupabaseClient): Promise<number> {
  const queue = buildReviewQueue(await getPositionMatrix(client))
  return queue.positions.length + queue.parties.length
}

export interface PositionEditorData {
  party: AdminParty
  axis: AdminAxis & { poleNegative: string | null; polePositive: string | null }
  position: AdminPosition | null
  evidence: EvidenceItem[]
  history: ChangeLogEntry[]
}

/** Tek bir parti × eksen için editör verisi; parti ya da eksen yoksa null. */
export async function getPositionEditorData(
  client: SupabaseClient,
  partyId: string,
  axisId: string
): Promise<PositionEditorData | null> {
  const [partyRes, axisRes, positionRes] = await Promise.all([
    client.from('parties').select('*').eq('id', partyId).maybeSingle(),
    client
      .from('axes')
      .select('id, name, slug, order_index, pole_negative, pole_positive')
      .eq('id', axisId)
      .maybeSingle(),
    client
      .from('party_positions')
      .select('id, party_id, axis_id, score, updated_at, last_verified_at')
      .eq('party_id', partyId)
      .eq('axis_id', axisId)
      .maybeSingle(),
  ])
  if (partyRes.error) throw partyRes.error
  if (axisRes.error) throw axisRes.error
  if (positionRes.error) throw positionRes.error
  if (!partyRes.data || !axisRes.data) {
    return null
  }

  const position = positionRes.data ? positionFromRow(positionRes.data) : null
  let evidence: EvidenceItem[] = []
  let history: ChangeLogEntry[] = []

  if (position) {
    const [evidenceRes, historyRes] = await Promise.all([
      client
        .from('party_position_evidence')
        .select('source_type, source_title, source_url, source_date, quote, rationale')
        .eq('party_position_id', position.id)
        .order('created_at', { ascending: true }),
      client
        .from('content_change_logs')
        .select('id, action, changes, note, public_note, is_public, created_at')
        .eq('subject_table', 'party_positions')
        .eq('subject_id', position.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ])
    if (evidenceRes.error) throw evidenceRes.error
    if (historyRes.error) throw historyRes.error

    evidence = (evidenceRes.data ?? []) as EvidenceItem[]
    history = (historyRes.data ?? []).map((row) => ({
      id: row.id as string,
      action: row.action as string,
      changes: (row.changes ?? {}) as Record<string, unknown>,
      note: row.note as string | null,
      publicNote: row.public_note as string | null,
      isPublic: row.is_public as boolean,
      createdAt: row.created_at as string,
    }))
  }

  const axisRow = axisRes.data
  return {
    party: partyFromRow(partyRes.data),
    axis: {
      id: axisRow.id as string,
      name: axisRow.name as string,
      slug: axisRow.slug as string,
      orderIndex: axisRow.order_index as number,
      poleNegative: axisRow.pole_negative as string | null,
      polePositive: axisRow.pole_positive as string | null,
    },
    position,
    evidence,
    history,
  }
}

export interface PositionsFreshness {
  /** Konumların (skor/kanıt) en son değiştiği an. */
  updatedAt: string | null
  /** Konumların en son doğrulandığı an. */
  verifiedAt: string | null
}

function latest(values: (string | null)[]): string | null {
  return values.reduce<string | null>((max, value) => {
    if (!value) return max
    if (!max) return value
    return new Date(value).getTime() > new Date(max).getTime() ? value : max
  }, null)
}

/** Aktif modeldeki pozisyonların son değişim ve son doğrulama tarihleri. */
export async function getPositionsFreshness(
  client: SupabaseClient,
  axisModelId: string
): Promise<PositionsFreshness> {
  const { data: axes, error: axesError } = await client.from('axes').select('id').eq('axis_model_id', axisModelId)
  if (axesError) throw axesError
  const axisIds = (axes ?? []).map((axis) => axis.id as string)
  if (axisIds.length === 0) {
    return { updatedAt: null, verifiedAt: null }
  }

  const { data, error } = await client
    .from('party_positions')
    .select('updated_at, last_verified_at')
    .in('axis_id', axisIds)
  if (error) throw error

  const rows = data ?? []
  return {
    updatedAt: latest(rows.map((row) => row.updated_at as string | null)),
    verifiedAt: latest(rows.map((row) => row.last_verified_at as string | null)),
  }
}
