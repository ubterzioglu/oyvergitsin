import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { fetchPublicPeople } from '@/lib/siyaset-radari/public-data'
import { PublicPeopleQuerySchema } from '@/lib/validation/siyaset-radari'

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries())
    const query = PublicPeopleQuerySchema.parse(params)
    const people = await fetchPublicPeople(query)
    return NextResponse.json({ people })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Geçersiz filtre.' }, { status: 400 })
    }
    console.error('People API error:', error)
    return NextResponse.json({ error: 'Kişiler alınamadı.' }, { status: 500 })
  }
}
