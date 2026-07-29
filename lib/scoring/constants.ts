/** Skorlama metodolojisinin sabitleri (resultdeepresearch.html §5). */

/** Kullanıcı "bu konu benim için önemli" derse eksen ağırlığı. */
export const IMPORTANT_AXIS_WEIGHT = 1.5

/** Varsayılan eksen ağırlığı. */
export const DEFAULT_AXIS_WEIGHT = 1

/** Eksen skorlarının aralığı; parti uzaklığı normalizasyonunda kullanılır. */
export const AXIS_SCORE_RANGE = 200

/** Kapsama eşikleri: >= high "Yüksek", >= medium "Orta", altı "Düşük". */
export const COVERAGE_HIGH = 0.8
export const COVERAGE_MEDIUM = 0.5

/**
 * Bu oranın altındaki kapsamaya sahip eksenler parti eşleşmesinden çıkarılır.
 * Çok az maddeye dayanan bir eksen skoru güvenilir bir uzaklık üretmez.
 */
export const COVERAGE_MATCHING_THRESHOLD = COVERAGE_MEDIUM

/** Sonuç ekranında "sonuçlar birbirine yakın" uyarısının eşiği (puan). */
export const CLOSE_MATCH_MARGIN = 3

/** Kaydedilen snapshot'ların algoritma sürümü. */
export const ALGORITHM_VERSION = 2

/** Tek bir değer taşıyan, doğrudan kural aramasıyla puanlanan tipler. */
export const SINGLE_VALUE_TYPES = new Set([
  'single_choice',
  'dropdown_single',
  'forced_choice_pair',
  'likert_5',
  'likert_7',
  'scenario_single',
  'vignette_likert',
  'image_choice_single',
])

/** Birden çok seçenek işaretlenebilen tipler. */
export const MULTI_VALUE_TYPES = new Set([
  'multi_choice',
  'dropdown_multi',
  'scenario_multi',
  'image_choice_multi',
  'consent_checkbox_group',
])

export const MATRIX_TYPES = new Set(['matrix_single', 'matrix_multi'])

/** İdeolojik skora hiç girmeyen tipler. */
export const UNSCORED_TYPES = new Set([
  'open_text_short',
  'open_text_long',
  'file_upload',
  'date_input',
  'captcha_placeholder',
  'attention_check',
])
