import { NextResponse } from 'next/server'
import { fetchApprovedPoliticalEvents } from '@/lib/siyaset-radari/public-data'

export async function GET() {
  try {
    const events = await fetchApprovedPoliticalEvents()
    return NextResponse.json({ events })
  } catch (error) {
    console.error('Party switches API error:', error)
    return NextResponse.json({ error: 'Parti geçişleri alınamadı.' }, { status: 500 })
  }
}
