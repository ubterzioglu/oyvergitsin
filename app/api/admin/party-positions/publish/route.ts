import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/radar/admin-auth'
import { PublishPositionSchema } from '@/lib/validation/content-admin'
import { diffPosition, type EvidenceItem } from '@/lib/content-review/position-diff'
import { mapContentRpcError } from '@/lib/content-review/rpc-error'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok || !auth.userId) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const input = PublishPositionSchema.parse(body)
    const admin = getAdminClient()

    // Değişiklik yoksa yayın yerine "doğrula" kullanılmalı; günlük gereksiz kayıtla dolmasın.
    const { data: current, error: currentError } = await admin
      .from('party_positions')
      .select('id, score')
      .eq('party_id', input.partyId)
      .eq('axis_id', input.axisId)
      .maybeSingle()
    if (currentError) throw currentError

    if (current) {
      const { data: currentEvidence, error: evidenceError } = await admin
        .from('party_position_evidence')
        .select('source_type, source_title, source_url, source_date, quote, rationale')
        .eq('party_position_id', current.id)
      if (evidenceError) throw evidenceError

      const diff = diffPosition(
        { score: current.score as number, evidence: (currentEvidence ?? []) as EvidenceItem[] },
        { score: input.score, evidence: input.evidence }
      )
      if (!diff.hasChanges) {
        return NextResponse.json(
          { error: 'Değişiklik yok. Konum hâlâ geçerliyse "Doğrulandı" butonunu kullanın.' },
          { status: 400 }
        )
      }
    }

    const { data, error } = await admin.rpc('publish_party_position', {
      p_party_id: input.partyId,
      p_axis_id: input.axisId,
      p_expected_updated_at: input.expectedUpdatedAt,
      p_score: input.score,
      p_evidence: input.evidence,
      p_note: input.note ?? null,
      p_public_note: input.publicNote ?? null,
      p_is_public: input.isPublic,
      p_actor: auth.userId,
    })

    if (error) {
      const mapped = mapContentRpcError(error)
      if (mapped.status === 500) {
        console.error('Party position publish rpc error:', error)
      }
      return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    }

    return NextResponse.json({ ok: true, updatedAt: data })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Geçersiz istek.' },
        { status: 400 }
      )
    }
    console.error('Party position publish error:', error)
    return NextResponse.json({ error: 'İşlem başarısız oldu.' }, { status: 500 })
  }
}
