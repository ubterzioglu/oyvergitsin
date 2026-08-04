import { describe, expect, it } from 'vitest'
import { isSurveyAnswerFilled, validateSurveyCompletion } from './completion'

describe('isSurveyAnswerFilled', () => {
  it('accepts no_opinion as a filled single answer', () => {
    expect(isSurveyAnswerFilled('likert_5', 'no_opinion')).toBe(true)
  })

  it('rejects empty and empty multi-value answers', () => {
    expect(isSurveyAnswerFilled('likert_5', '')).toBe(false)
    expect(isSurveyAnswerFilled('multi_choice', '[]')).toBe(false)
    expect(isSurveyAnswerFilled('allocation', '{"a":0,"b":0}')).toBe(false)
  })

  it('accepts filled structured answers', () => {
    expect(isSurveyAnswerFilled('multi_choice', '["a"]')).toBe(true)
    expect(isSurveyAnswerFilled('allocation', '{"a":40,"b":0}')).toBe(true)
    expect(isSurveyAnswerFilled('matrix_single', '{"row1":["agree"]}')).toBe(true)
  })
})

describe('validateSurveyCompletion', () => {
  const questions = [
    { id: 'q1', type: 'likert_5' },
    { id: 'q2', type: 'likert_5' },
    { id: 'attention', type: 'attention_check', expected_value: 'disagree' },
  ]

  it('passes when all questions are answered and attention check is correct', () => {
    expect(
      validateSurveyCompletion(questions, [
        { questionId: 'q1', value: 'agree' },
        { questionId: 'q2', value: 'no_opinion' },
        { questionId: 'attention', value: 'disagree' },
      ])
    ).toEqual({
      ok: true,
      firstInvalidQuestionId: null,
      missingQuestionIds: [],
      failedAttentionQuestionIds: [],
    })
  })

  it('reports the first missing question', () => {
    expect(
      validateSurveyCompletion(questions, [
        { questionId: 'q1', value: 'agree' },
        { questionId: 'attention', value: 'disagree' },
      ])
    ).toMatchObject({
      ok: false,
      firstInvalidQuestionId: 'q2',
      missingQuestionIds: ['q2'],
    })
  })

  it('reports failed attention checks', () => {
    expect(
      validateSurveyCompletion(questions, [
        { questionId: 'q1', value: 'agree' },
        { questionId: 'q2', value: 'agree' },
        { questionId: 'attention', value: 'agree' },
      ])
    ).toMatchObject({
      ok: false,
      firstInvalidQuestionId: 'attention',
      failedAttentionQuestionIds: ['attention'],
    })
  })
})
