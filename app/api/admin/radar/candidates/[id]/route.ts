import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/radar/admin-auth'
import { CandidateActionSchema } from '@/lib/validation/radar'
import type { Database } from '@/lib/supabase/client'

type CandidateRow = Database['public']['Tables']['news_candidates']['Row']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok || !auth.userId) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await request.json().catch(() => ({}))
    const { action, duplicateOfId, note } = CandidateActionSchema.parse(body)

    const admin = getAdminClient()
    const nowIso = new Date().toISOString()

    const { data: candidate, error: fetchError } = await admin
      .from('news_candidates')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !candidate) {
      return NextResponse.json({ error: 'Aday bulunamadı.' }, { status: 404 })
    }

    const typedCandidate = candidate as CandidateRow

    if (action === 'approve') {
      const { data: post, error: postError } = await admin
        .from('news_posts')
        .insert({
          title: typedCandidate.title,
          summary: typedCandidate.summary,
          source_name: typedCandidate.source_name,
          source_url: typedCandidate.source_url,
          original_url: typedCandidate.original_url,
          image_url: typedCandidate.image_source_url,
          category: typedCandidate.category,
          language: typedCandidate.language,
          country: typedCandidate.country,
          published_at: typedCandidate.published_at,
          status: 'active',
          radar_candidate_id: typedCandidate.id,
          approved_by: auth.userId,
          approved_at: nowIso
        })
        .select('id')
        .single()

      if (postError || !post) {
        throw new Error(postError?.message ?? 'Haber oluşturulamadı.')
      }

      const { error: updateError } = await admin
        .from('news_candidates')
        .update({
          review_status: 'approved',
          approved_news_post_id: post.id,
          reviewed_by: auth.userId,
          reviewed_at: nowIso,
          review_note: note ?? null
        })
        .eq('id', id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      await admin.from('news_review_logs').insert({
        candidate_id: id,
        action: 'approve',
        actor_user_id: auth.userId,
        note: note ?? null
      })

      return NextResponse.json({ ok: true, newsPostId: post.id })
    }

    if (action === 'reject') {
      const { error: updateError } = await admin
        .from('news_candidates')
        .update({
          review_status: 'rejected',
          reviewed_by: auth.userId,
          reviewed_at: nowIso,
          review_note: note ?? null
        })
        .eq('id', id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      await admin.from('news_review_logs').insert({
        candidate_id: id,
        action: 'reject',
        actor_user_id: auth.userId,
        note: note ?? null
      })

      return NextResponse.json({ ok: true })
    }

    // action === 'duplicate'
    const { error: updateError } = await admin
      .from('news_candidates')
      .update({
        review_status: 'duplicate',
        duplicate_of_candidate_id: duplicateOfId ?? null,
        reviewed_by: auth.userId,
        reviewed_at: nowIso,
        review_note: note ?? null
      })
      .eq('id', id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    await admin.from('news_review_logs').insert({
      candidate_id: id,
      action: 'duplicate',
      actor_user_id: auth.userId,
      note: note ?? null
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
    }
    console.error('Candidate action error:', error)
    return NextResponse.json({ error: 'İşlem başarısız oldu.' }, { status: 500 })
  }
}
