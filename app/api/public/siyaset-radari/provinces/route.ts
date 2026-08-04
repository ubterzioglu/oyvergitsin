import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { fetchApprovedProvinceResults } from '@/lib/siyaset-radari/public-data'
import { ProvinceQuerySchema } from '@/lib/validation/siyaset-radari'

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries())
    const query = ProvinceQuerySchema.parse(params)
    const results = await fetchApprovedProvinceResults(query)
    return NextResponse.json({ results })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Geçersiz filtre.' }, { status: 400 })
    }
    console.error('Province API error:', error)
    return NextResponse.json({ error: 'İl sonuçları alınamadı.' }, { status: 500 })
  }
}
