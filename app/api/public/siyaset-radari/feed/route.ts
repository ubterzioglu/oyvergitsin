import { NextResponse } from 'next/server'
import { fetchApprovedFeedItems } from '@/lib/siyaset-radari/public-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const items = await fetchApprovedFeedItems()
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Siyaset radari feed API error:', error)
    return NextResponse.json({ error: 'Güncel akış alınamadı.' }, { status: 500 })
  }
}
