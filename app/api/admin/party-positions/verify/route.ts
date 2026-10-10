import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/radar/admin-auth'
import { VerifyPositionSchema } from '@/lib/validation/content-admin'
import { mapContentRpcError } from '@/lib/content-review/rpc-error'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok || !auth.userId) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const input = VerifyPositionSchema.parse(body)

    const { data, error } = await getAdminClient().rpc('verify_party_position', {
      p_party_position_id: input.positionId,
      p_note: input.note ?? null,
      p_actor: auth.userId,
    })

    if (error) {
      const mapped = mapContentRpcError(error)
      if (mapped.status === 500) {
        console.error('Party position verify rpc error:', error)
      }
      return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    }

    return NextResponse.json({ ok: true, lastVerifiedAt: data })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
    }
    console.error('Party position verify error:', error)
    return NextResponse.json({ error: 'İşlem başarısız oldu.' }, { status: 500 })
  }
}
