import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/radar/admin-auth'
import { SiyasetRadariReviewSchema } from '@/lib/validation/siyaset-radari'

const REVIEWED_BY_TABLES = new Set([
  'public_people',
  'political_affiliation_events',
  'journalist_status_events',
  'radar_feed_items',
])

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok || !auth.userId) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { subjectTable, subjectId, action, note } = SiyasetRadariReviewSchema.parse(body)
    const admin = getAdminClient()
    const nowIso = new Date().toISOString()
    const nextStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'archived'
    const visibility = action === 'approve' ? 'public' : 'private'

    const updatePayload: Record<string, unknown> = {
      review_status: nextStatus,
      visibility,
    }

    if (REVIEWED_BY_TABLES.has(subjectTable)) {
      updatePayload.reviewed_by = auth.userId
      updatePayload.reviewed_at = nowIso
      updatePayload.review_note = note ?? null
    }

    const { error } = await admin.from(subjectTable).update(updatePayload).eq('id', subjectId)
    if (error) {
      throw new Error(error.message)
    }

    await admin.from('public_data_review_logs').insert({
      subject_table: subjectTable,
      subject_id: subjectId,
      action,
      actor_user_id: auth.userId,
      note: note ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
    }
    console.error('Siyaset radari review error:', error)
    return NextResponse.json({ error: 'İşlem başarısız oldu.' }, { status: 500 })
  }
}
