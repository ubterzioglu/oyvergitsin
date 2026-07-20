export interface QuestionTypeInfo {
  value: string
  label: string
  optionBased: boolean
}

// optionBased: true => bugün /survey ekranında doğru şekilde render edilir
// (question_options üzerinden buton listesi). Diğer tipler admin panelinden
// veri girilebilir ama anket ekranında henüz özel bir input bileşeni yok.
export const QUESTION_TYPES: QuestionTypeInfo[] = [
  { value: 'single_choice', label: 'Tekli seçim', optionBased: true },
  { value: 'multi_choice', label: 'Çoklu seçim', optionBased: true },
  { value: 'dropdown_single', label: 'Açılır liste (tekli)', optionBased: true },
  { value: 'dropdown_multi', label: 'Açılır liste (çoklu)', optionBased: true },
  { value: 'ranking', label: 'Sıralama', optionBased: false },
  { value: 'forced_choice_pair', label: 'Zorunlu ikili seçim', optionBased: true },
  { value: 'matrix_single', label: 'Matris (tekli)', optionBased: false },
  { value: 'matrix_multi', label: 'Matris (çoklu)', optionBased: false },
  { value: 'likert_5', label: 'Likert (5 nokta)', optionBased: true },
  { value: 'likert_7', label: 'Likert (7 nokta)', optionBased: true },
  { value: 'slider_0_100', label: 'Kaydırıcı (0-100)', optionBased: false },
  { value: 'numeric_input', label: 'Sayısal giriş', optionBased: false },
  { value: 'allocation', label: 'Puan dağıtımı', optionBased: false },
  { value: 'scenario_single', label: 'Senaryo (tekli)', optionBased: true },
  { value: 'scenario_multi', label: 'Senaryo (çoklu)', optionBased: true },
  { value: 'vignette_likert', label: 'Vinyet + Likert', optionBased: false },
  { value: 'open_text_short', label: 'Kısa açık metin', optionBased: false },
  { value: 'open_text_long', label: 'Uzun açık metin', optionBased: false },
  { value: 'image_choice_single', label: 'Görsel seçim (tekli)', optionBased: true },
  { value: 'image_choice_multi', label: 'Görsel seçim (çoklu)', optionBased: true },
  { value: 'file_upload', label: 'Dosya yükleme', optionBased: false },
  { value: 'date_input', label: 'Tarih girişi', optionBased: false },
  { value: 'consent_checkbox_group', label: 'Onay kutuları grubu', optionBased: true },
  { value: 'attention_check', label: 'Dikkat kontrolü', optionBased: true },
  { value: 'captcha_placeholder', label: 'CAPTCHA (yer tutucu)', optionBased: false },
]

export function isOptionBasedType(type: string): boolean {
  return QUESTION_TYPES.find((t) => t.value === type)?.optionBased ?? false
}
