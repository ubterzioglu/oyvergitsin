import 'server-only'
import { getPublicServerClient } from '@/lib/supabase/route'
import { getActiveAxisModelId } from '@/lib/scoring/active-model'

/**
 * Platformun kendisi hakkındaki sayısal gerçekler — eksenler, soru sayısı,
 * karşılaştırmaya dahil partiler.
 *
 * Neden tek kaynak: Bu değerler ana sayfaya, metodoloji sayfasına, JSON-LD
 * bloklarına ve llms.txt'e elle kopyalanmıştı ve hepsi bayatlamıştı. Aktif
 * model v2 (8 eksen, 25 soru, 13 parti) iken ana sayfa hâlâ v1'in "10 eksen"
 * listesini, llms.txt ise "10 eksen / 12 parti" yazıyordu. Yanlış sayı üretken
 * arama motorlarının yanıtlarına aynen geçtiği için bu sayfalarda sabit sayı
 * yazmıyoruz; hepsi buradan türetiliyor.
 *
 * Eksen çözümü her zaman getActiveAxisModelId üzerinden yapılır — eksenleri
 * başka bir yerde bağımsız çözmek v1/v2 karışmasına yol açıyor (bkz. CLAUDE.md).
 */

export interface PlatformAxis {
  slug: string
  name: string
  description: string | null
  poleNegative: string | null
  polePositive: string | null
}

export interface PlatformParty {
  name: string
  shortName: string | null
}

export interface PlatformFacts {
  axisModelVersion: string
  axes: PlatformAxis[]
  questionCount: number
  parties: PlatformParty[]
}

export const EMPTY_PLATFORM_FACTS: PlatformFacts = {
  axisModelVersion: '',
  axes: [],
  questionCount: 0,
  parties: []
}

/**
 * Aktif eksen modelinin gerçeklerini okur.
 *
 * Supabase erişilemezse boş bir sonuç döner: bu veriyi tüketen sayfalar
 * tanıtım sayfaları, kritik akış değil — altyapı arızasında eksen listesi
 * olmadan render olmaları, 500 vermelerinden iyi.
 */
export async function getPlatformFacts(): Promise<PlatformFacts> {
  try {
    const supabase = getPublicServerClient()
    const axisModelId = await getActiveAxisModelId(supabase)

    if (!axisModelId) {
      return EMPTY_PLATFORM_FACTS
    }

    const [modelResult, axesResult, questionsResult, partiesResult] = await Promise.all([
      supabase.from('axis_models').select('version').eq('id', axisModelId).single(),
      supabase
        .from('axes')
        .select('slug, name, description, pole_negative, pole_positive')
        .eq('axis_model_id', axisModelId)
        .order('order_index', { ascending: true }),
      supabase
        .from('questions')
        .select('id', { head: true, count: 'exact' })
        .eq('axis_model_id', axisModelId),
      supabase
        .from('parties')
        .select('name, short_name')
        .eq('is_active', true)
        .order('name', { ascending: true })
    ])

    return {
      axisModelVersion: modelResult.data?.version ?? '',
      axes: (axesResult.data ?? []).map((axis) => ({
        slug: axis.slug,
        name: axis.name,
        description: axis.description ?? null,
        poleNegative: axis.pole_negative ?? null,
        polePositive: axis.pole_positive ?? null
      })),
      questionCount: questionsResult.count ?? 0,
      parties: (partiesResult.data ?? []).map((party) => ({
        name: party.name,
        shortName: party.short_name ?? null
      }))
    }
  } catch (error) {
    console.error('[platform-facts] aktif model gercekleri okunamadi', error)
    return EMPTY_PLATFORM_FACTS
  }
}
