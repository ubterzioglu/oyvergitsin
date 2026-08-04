import type { SupabaseClient } from '@supabase/supabase-js'
import { parseTbmmSeatDistribution } from './parsers/tbmm-seat-distribution'
import { parseTgsJournalists } from './parsers/tgs-journalists'
import { confidenceForUrl } from './source-confidence'
import { normalizeName, slugifyName } from './slug'
import type { ParsedJournalistStatus, ScanOutcome, SiyasetRadariScanSummary } from './types'

const TBMM_SEAT_DISTRIBUTION_URL = 'https://www.tbmm.gov.tr/sandalyedagilimi'
const TGS_JOURNALISTS_URL = 'https://tgs.org.tr/cezaevindeki-gazeteciler/'

export type SiyasetRadariScanSource = 'all' | 'tbmm' | 'journalists'

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'oyvergitsin.org public-interest data verifier',
      Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`${url} ${response.status} döndürdü.`)
  }

  return response.text()
}

async function findOrCreatePerson(
  supabaseAdmin: SupabaseClient,
  person: Pick<ParsedJournalistStatus, 'fullName'>,
  role: 'politician' | 'journalist'
): Promise<{ id: string; inserted: boolean }> {
  const fullName = normalizeName(person.fullName)
  const slug = slugifyName(fullName)
  const nowIso = new Date().toISOString()

  const { data: existing, error: selectError } = await supabaseAdmin
    .from('public_people')
    .select('id, primary_role')
    .eq('slug', slug)
    .maybeSingle()

  if (selectError) {
    throw new Error(selectError.message)
  }

  if (existing?.id) {
    const nextRole = existing.primary_role === role ? role : 'both'
    const { error: updateError } = await supabaseAdmin
      .from('public_people')
      .update({ primary_role: nextRole, last_verified_at: nowIso })
      .eq('id', existing.id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    return { id: existing.id as string, inserted: false }
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('public_people')
    .insert({
      slug,
      full_name: fullName,
      primary_role: role,
      review_status: 'pending',
      visibility: 'private',
      last_verified_at: nowIso,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? 'Kişi kaydı oluşturulamadı.')
  }

  return { id: inserted.id as string, inserted: true }
}

async function scanTgsJournalists(supabaseAdmin: SupabaseClient): Promise<ScanOutcome> {
  const outcome: ScanOutcome = {
    source: 'TGS cezaevindeki gazeteciler',
    fetched: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: false,
    errorMessage: null,
  }

  try {
    const html = await fetchText(TGS_JOURNALISTS_URL)
    const journalists = parseTgsJournalists(html)
    const nowIso = new Date().toISOString()
    outcome.fetched = journalists.length

    for (const journalist of journalists) {
      const { id: personId, inserted: personInserted } = await findOrCreatePerson(supabaseAdmin, journalist, 'journalist')
      if (personInserted) {
        outcome.inserted += 1
      }

      const { data: existing, error: selectError } = await supabaseAdmin
        .from('journalist_status_events')
        .select('id')
        .eq('person_id', personId)
        .eq('source_url', TGS_JOURNALISTS_URL)
        .maybeSingle()

      if (selectError) {
        throw new Error(selectError.message)
      }

      const payload = {
        outlet: journalist.outlet,
        job_title: journalist.jobTitle,
        status: journalist.status,
        status_label: journalist.statusLabel,
        source_name: 'Türkiye Gazeteciler Sendikası',
        source_url: TGS_JOURNALISTS_URL,
        source_confidence: confidenceForUrl(TGS_JOURNALISTS_URL),
        last_verified_at: nowIso,
        raw_payload: journalist,
      }

      if (existing?.id) {
        const { error: updateError } = await supabaseAdmin
          .from('journalist_status_events')
          .update(payload)
          .eq('id', existing.id)

        if (updateError) {
          throw new Error(updateError.message)
        }
        outcome.updated += 1
        continue
      }

      const { data: event, error: insertError } = await supabaseAdmin
        .from('journalist_status_events')
        .insert({
          person_id: personId,
          ...payload,
          review_status: 'pending',
          visibility: 'private',
        })
        .select('id')
        .single()

      if (insertError || !event) {
        throw new Error(insertError?.message ?? 'Gazeteci durum kaydı oluşturulamadı.')
      }

      await supabaseAdmin.from('public_data_evidence').insert({
        person_id: personId,
        journalist_event_id: event.id,
        subject_type: 'journalist_event',
        source_type: 'ngo',
        source_name: 'Türkiye Gazeteciler Sendikası',
        source_url: TGS_JOURNALISTS_URL,
        title: 'Cezaevindeki gazeteciler',
        source_confidence: confidenceForUrl(TGS_JOURNALISTS_URL),
        review_status: 'pending',
        visibility: 'private',
      })

      outcome.inserted += 1
    }
  } catch (error) {
    outcome.failed = true
    outcome.errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
  }

  return outcome
}

async function scanTbmmSeatDistribution(supabaseAdmin: SupabaseClient): Promise<ScanOutcome> {
  const outcome: ScanOutcome = {
    source: 'TBMM sandalye dağılımı',
    fetched: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: false,
    errorMessage: null,
  }

  try {
    const html = await fetchText(TBMM_SEAT_DISTRIBUTION_URL)
    const rows = parseTbmmSeatDistribution(html)
    const nowIso = new Date().toISOString()
    outcome.fetched = rows.length

    for (const row of rows) {
      const lookup = {
        election_year: 2023,
        election_type: 'tbmm_current_seat_distribution',
        area_level: 'country',
        area_name: 'Türkiye',
        party_name: row.partyName,
      }

      const { data: existing, error: selectError } = await supabaseAdmin
        .from('election_results_by_area')
        .select('id')
        .match(lookup)
        .maybeSingle()

      if (selectError) {
        throw new Error(selectError.message)
      }

      const payload = {
        ...lookup,
        seat_count: row.seatCount,
        vote_count: null,
        vote_share: null,
        source_name: 'Türkiye Büyük Millet Meclisi',
        source_url: TBMM_SEAT_DISTRIBUTION_URL,
        source_confidence: confidenceForUrl(TBMM_SEAT_DISTRIBUTION_URL),
        last_verified_at: nowIso,
        raw_payload: row,
      }

      if (existing?.id) {
        const { error: updateError } = await supabaseAdmin
          .from('election_results_by_area')
          .update(payload)
          .eq('id', existing.id)

        if (updateError) {
          throw new Error(updateError.message)
        }
        outcome.updated += 1
        continue
      }

      const { error: insertError } = await supabaseAdmin.from('election_results_by_area').insert({
        ...payload,
        review_status: 'pending',
        visibility: 'private',
      })

      if (insertError) {
        throw new Error(insertError.message)
      }
      outcome.inserted += 1
    }
  } catch (error) {
    outcome.failed = true
    outcome.errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
  }

  return outcome
}

export async function runSiyasetRadariScan(
  supabaseAdmin: SupabaseClient,
  source: SiyasetRadariScanSource
): Promise<SiyasetRadariScanSummary> {
  const scanners = [
    ...(source === 'all' || source === 'tbmm' ? [scanTbmmSeatDistribution] : []),
    ...(source === 'all' || source === 'journalists' ? [scanTgsJournalists] : []),
  ]

  const outcomes: ScanOutcome[] = []
  for (const scanner of scanners) {
    outcomes.push(await scanner(supabaseAdmin))
  }

  const failedCount = outcomes.filter((outcome) => outcome.failed).length
  const status = failedCount === 0 ? 'completed' : failedCount === outcomes.length ? 'failed' : 'partial'

  return { status, outcomes }
}
