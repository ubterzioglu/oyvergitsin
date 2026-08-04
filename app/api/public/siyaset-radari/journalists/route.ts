import { NextResponse } from 'next/server'
import { fetchApprovedJournalistEvents } from '@/lib/siyaset-radari/public-data'

export async function GET() {
  try {
    const events = await fetchApprovedJournalistEvents()
    return NextResponse.json({ events })
  } catch (error) {
    console.error('Journalists API error:', error)
    return NextResponse.json({ error: 'Gazeteci kayıtları alınamadı.' }, { status: 500 })
  }
}
