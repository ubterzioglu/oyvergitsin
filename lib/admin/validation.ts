export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

const SLUG_PATTERN = /^[a-z0-9_]+$/

export function validateAxisForm(values: {
  name: string
  description: string
  slug: string
  order_index: number | string
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!values.name.trim()) {
    errors.name = 'Ad zorunludur'
  }

  if (!values.description.trim()) {
    errors.description = 'Açıklama zorunludur'
  }

  if (!values.slug.trim()) {
    errors.slug = 'Slug zorunludur'
  } else if (!SLUG_PATTERN.test(values.slug.trim())) {
    errors.slug = 'Slug yalnızca küçük harf, rakam ve alt çizgi içerebilir'
  }

  const orderIndex = Number(values.order_index)
  if (!Number.isFinite(orderIndex) || orderIndex < 0) {
    errors.order_index = 'Sıra pozitif bir sayı olmalıdır'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateQuestionForm(values: {
  text: string
  type: string
  order_index: number | string
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!values.text.trim()) {
    errors.text = 'Soru metni zorunludur'
  }

  if (!values.type.trim()) {
    errors.type = 'Soru tipi zorunludur'
  }

  const orderIndex = Number(values.order_index)
  if (!Number.isFinite(orderIndex) || orderIndex < 0) {
    errors.order_index = 'Sıra pozitif bir sayı olmalıdır'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateOptionForm(values: {
  text: string
  value: string
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!values.text.trim()) {
    errors.text = 'Seçenek metni zorunludur'
  }

  if (!values.value.trim()) {
    errors.value = 'Seçenek değeri zorunludur'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateScoringRuleForm(
  values: {
    answer_value: string
    axis_id: string
    score_modifier: number | string
  },
  existingRules: Array<{ answer_value: string; axis_id: string }>
): ValidationResult {
  const errors: Record<string, string> = {}

  if (!values.answer_value.trim()) {
    errors.answer_value = 'Cevap değeri zorunludur'
  }

  if (!values.axis_id.trim()) {
    errors.axis_id = 'Eksen seçilmelidir'
  }

  const scoreModifier = Number(values.score_modifier)
  if (!Number.isFinite(scoreModifier) || scoreModifier < -100 || scoreModifier > 100) {
    errors.score_modifier = 'Puan -100 ile 100 arasında olmalıdır'
  }

  const isDuplicate = existingRules.some(
    (rule) => rule.answer_value === values.answer_value.trim() && rule.axis_id === values.axis_id
  )
  if (isDuplicate) {
    errors.axis_id = 'Bu cevap ve eksen için zaten bir puanlama kuralı var'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
