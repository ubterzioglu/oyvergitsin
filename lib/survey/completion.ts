interface CompletionQuestion {
  id: string
  type: string
  expected_value?: string | null
}

interface CompletionAnswer {
  questionId: string
  value: string
}

export interface SurveyCompletionValidation {
  ok: boolean
  firstInvalidQuestionId: string | null
  missingQuestionIds: string[]
  failedAttentionQuestionIds: string[]
}

const MULTI_VALUE_TYPES = new Set([
  'matrix_single',
  'matrix_multi',
  'allocation',
  'multi_choice',
  'dropdown_multi',
  'scenario_multi',
  'image_choice_multi',
  'consent_checkbox_group',
])

function parseJsonAnswer<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function isSurveyAnswerFilled(questionType: string, raw: string | undefined): boolean {
  if (!raw) return false
  if (!MULTI_VALUE_TYPES.has(questionType)) return true

  if (questionType === 'allocation') {
    const parsed = parseJsonAnswer<Record<string, number>>(raw, {})
    return Object.values(parsed).some((n) => n > 0)
  }
  if (questionType === 'matrix_single' || questionType === 'matrix_multi') {
    const parsed = parseJsonAnswer<Record<string, string[]>>(raw, {})
    return Object.keys(parsed).length > 0
  }

  const parsed = parseJsonAnswer<string[]>(raw, [])
  return parsed.length > 0
}

export function validateSurveyCompletion(
  questions: CompletionQuestion[],
  answers: CompletionAnswer[]
): SurveyCompletionValidation {
  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.value]))
  const missingQuestionIds: string[] = []
  const failedAttentionQuestionIds: string[] = []

  for (const question of questions) {
    const rawAnswer = answerByQuestion.get(question.id)
    if (!isSurveyAnswerFilled(question.type, rawAnswer)) {
      missingQuestionIds.push(question.id)
      continue
    }

    if (
      question.type === 'attention_check' &&
      question.expected_value &&
      rawAnswer?.trim() !== question.expected_value
    ) {
      failedAttentionQuestionIds.push(question.id)
    }
  }

  const firstInvalidQuestionId = missingQuestionIds[0] ?? failedAttentionQuestionIds[0] ?? null

  return {
    ok: !firstInvalidQuestionId,
    firstInvalidQuestionId,
    missingQuestionIds,
    failedAttentionQuestionIds,
  }
}
