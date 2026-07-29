import { LIKERT_MAX, LIKERT_SCORES } from './likert'
import type { ScorableQuestion, ScoringRule, UserAnswer } from './types'

/**
 * Test verisi üreticileri. Yalnızca *.test.ts dosyalarından kullanılır;
 * uygulama kodunun bu modüle bağımlılığı yoktur.
 */

export function likertRules(axisId: string, reversed = false): ScoringRule[] {
  const sign = reversed ? -1 : 1

  return Object.entries(LIKERT_SCORES).map(([answerValue, score]) => ({
    answerValue,
    axisId,
    scoreModifier: sign * score,
  }))
}

export function likertQuestion(
  id: string,
  axisId: string,
  options: { reversed?: boolean; weight?: number } = {}
): ScorableQuestion {
  return {
    id,
    type: 'likert_5',
    isScored: true,
    weight: options.weight ?? 1,
    maxContribution: LIKERT_MAX,
    expectedValue: null,
    rules: likertRules(axisId, options.reversed),
  }
}

export function question(overrides: Partial<ScorableQuestion> & { id: string }): ScorableQuestion {
  return {
    type: 'single_choice',
    isScored: true,
    weight: 1,
    maxContribution: null,
    expectedValue: null,
    rules: [],
    ...overrides,
  }
}

export function answer(questionId: string, value: string, isImportant = false): UserAnswer {
  return { questionId, value, isImportant }
}
