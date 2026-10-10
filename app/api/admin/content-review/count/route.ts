import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/radar/admin-auth'
import { getReviewQueueCount } from '@/lib/content-review/queries'

export const dynamic = 'force-dynamic'

/** Admin menüsündeki "Gözden geçir" rozetinin sayısı. */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })
  }

  try {
    return NextResponse.json({ count: await getReviewQueueCount(getAdminClient()) })
  } catch (error) {
    console.error('Content review count error:', error)
    return NextResponse.json({ error: 'Sayı alınamadı.' }, { status: 500 })
  }
}
