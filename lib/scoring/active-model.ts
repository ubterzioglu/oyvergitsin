import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Yalnızca yerel önizleme içindir: henüz aktif edilmemiş bir eksen modelini
 * (ör. "v2") canlı `is_active` bayrağına dokunmadan denemeyi sağlar.
 *
 * Üretimde tanımlı BIRAKILMAMALIDIR. Sunucu tarafı bir değişkendir; istemciden
 * ya da istek parametresinden ayarlanamaz.
 */
const PREVIEW_VERSION = process.env.PREVIEW_AXIS_MODEL_VERSION

/**
 * Aktif eksen modelinin id'si.
 *
 * Eksen modeli sürümlenebilir olduğu için (v1 demo içeriği, v2 metodoloji
 * içeriği) hem anket ekranı hem skorlama motoru yalnızca AKTİF modele ait
 * eksen ve soruları kullanmalıdır. Bu çözüm tek yerde tutulur; admin paneli
 * de aynı kuralı uyguluyor (app/admin/axes/page.tsx).
 *
 * Birden fazla model yanlışlıkla aktif bırakılırsa en eski oluşturulan
 * kullanılır — davranış rastgele olmasın diye sıralama açıkça verilir.
 */
export async function getActiveAxisModelId(supabase: SupabaseClient): Promise<string | null> {
  const query = supabase.from('axis_models').select('id')

  const { data, error } = await (PREVIEW_VERSION
    ? query.eq('version', PREVIEW_VERSION)
    : query.eq('is_active', true)
  )
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  return data?.id ?? null
}
