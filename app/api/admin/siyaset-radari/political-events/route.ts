import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/radar/admin-auth'
import { confidenceForUrl } from '@/lib/siyaset-radari/source-confidence'
import { normalizeName, slugifyName } from '@/lib/siyaset-radari/slug'
import { ManualPoliticalSwitchSchema } from '@/lib/validation/siyaset-radari'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok || !auth.userId) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const input = ManualPoliticalSwitchSchema.parse(body)
    const admin = getAdminClient()
    const fullName = normalizeName(input.fullName)
    const slug = slugifyName(fullName)
    const nowIso = new Date().toISOString()

    const { data: existingPerson, error: personLookupError } = await admin
      .from('public_people')
      .select('id, primary_role')
      .eq('slug', slug)
      .maybeSingle()

    if (personLookupError) {
      throw new Error(personLookupError.message)
    }

    let personId: string
    if (existingPerson?.id) {
      personId = existingPerson.id as string
      const nextRole = existingPerson.primary_role === 'journalist' ? 'both' : 'politician'
      const { error } = await admin
        .from('public_people')
        .update({
          primary_role: nextRole,
          x_handle: input.xHandle || null,
          province: input.province || null,
          last_verified_at: nowIso,
        })
        .eq('id', personId)
      if (error) {
        throw new Error(error.message)
      }
    } else {
      const { data: insertedPerson, error } = await admin
        .from('public_people')
        .insert({
          slug,
          full_name: fullName,
          primary_role: 'politician',
          province: input.province || null,
          x_handle: input.xHandle || null,
          review_status: 'pending',
          visibility: 'private',
          last_verified_at: nowIso,
        })
        .select('id')
        .single()

      if (error || !insertedPerson) {
        throw new Error(error?.message ?? 'Kişi kaydı oluşturulamadı.')
      }
      personId = insertedPerson.id as string
    }

    const sourceConfidence = confidenceForUrl(input.sourceUrl)
    const { data: event, error: eventError } = await admin
      .from('political_affiliation_events')
      .insert({
        person_id: personId,
        event_type: input.fromPartyName && input.toPartyName ? 'party_switch' : input.toPartyName ? 'party_join' : 'party_leave',
        from_party_name: input.fromPartyName || null,
        to_party_name: input.toPartyName || null,
        province: input.province || null,
        happened_on: input.happenedOn || null,
        summary: input.summary || null,
        source_name: input.sourceName,
        source_url: input.sourceUrl,
        source_confidence: sourceConfidence,
        review_status: 'pending',
        visibility: 'private',
        last_verified_at: nowIso,
        raw_payload: input,
      })
      .select('id')
      .single()

    if (eventError || !event) {
      throw new Error(eventError?.message ?? 'Parti geçiş kaydı oluşturulamadı.')
    }

    await admin.from('public_data_evidence').insert({
      person_id: personId,
      political_event_id: event.id,
      subject_type: 'political_event',
      source_type: sourceConfidence === 'official' ? 'official' : 'news',
      source_name: input.sourceName,
      source_url: input.sourceUrl,
      title: `${fullName} parti geçiş kaynağı`,
      excerpt: input.summary || null,
      source_confidence: sourceConfidence,
      review_status: 'pending',
      visibility: 'private',
    })

    await admin.from('public_data_review_logs').insert({
      subject_table: 'political_affiliation_events',
      subject_id: event.id,
      action: 'create_pending',
      actor_user_id: auth.userId,
      note: null,
    })

    return NextResponse.json({ ok: true, personId, eventId: event.id })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
    }
    console.error('Manual political event error:', error)
    return NextResponse.json({ error: 'Kayıt oluşturulamadı.' }, { status: 500 })
  }
}
