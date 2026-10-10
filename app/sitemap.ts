import type { MetadataRoute } from 'next'
import { getSiteUrl, LEGAL_ROUTES } from '@/lib/site'
import { fetchPublicPeople } from '@/lib/siyaset-radari/public-data'

// Kişi kayıtları veritabanından okunduğu için sitemap statik olarak
// önceden üretilemez; yoksa yeni onaylanan kişiler bir sonraki dağıtıma
// kadar sitemap'e girmez.
export const revalidate = 3600

// fetchPublicPeople varsayılan olarak 50 kayıt döner — sitemap tüm
// kayıtları istiyor.
const PERSON_LIMIT = 5000

type SitemapEntry = MetadataRoute.Sitemap[number]

/**
 * Kişi kayıtlarını sitemap girdilerine çevirir.
 *
 * Veritabanı erişilemezse sitemap'in tamamını kaybetmek yerine sadece
 * dinamik kısmı düşürüyoruz: Supabase kesintisi (bu projede yaşandı —
 * Cloudflare 521) build'i veya /sitemap.xml'i komple bozmamalı.
 */
async function getPersonEntries(siteUrl: string): Promise<SitemapEntry[]> {
  try {
    const people = await fetchPublicPeople({ limit: PERSON_LIMIT })

    return people.map((person) => ({
      url: `${siteUrl}/siyaset-radari/kisi/${person.slug}`,
      lastModified: person.lastVerifiedAt ? new Date(person.lastVerifiedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5
    }))
  } catch (error) {
    console.error('[sitemap] kisi kayitlari alinamadi, dinamik bolum atlaniyor', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const lastModified = new Date()

  const staticEntries: SitemapEntry[] = [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1
    },
    {
      url: `${siteUrl}/metodoloji`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8
    },
    {
      url: `${siteUrl}/siyaset-radari`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.8
    },
    {
      url: `${siteUrl}/siyaset-radari/meclis`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.7
    },
    {
      url: `${siteUrl}/siyaset-radari/tutuklu-gazeteciler`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7
    }
  ]

  const legalEntries: SitemapEntry[] = LEGAL_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: 'yearly' as const,
    priority: 0.3
  }))

  const personEntries = await getPersonEntries(siteUrl)

  return [...staticEntries, ...legalEntries, ...personEntries]
}
