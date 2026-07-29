import { computeAxisScores } from './axis-score'
import { buildExplanations, computePartyMatches } from './party-match'
import type { QualityFlags, ScorableQuestion, ScoringInput, ScoringOutput, UserAnswer } from './types'

/**
 * Skorlama çekirdeği: saf, yan etkisiz, veritabanı bağımsız.
 *
 * Girdi olarak aktif eksen modelinin eksenlerini, sorularını, kullanıcının
 * cevaplarını ve parti konumlarını alır; eksen skorlarını, parti eşleşmelerini
 * ve açıklamaları döner.
 */
export function calculate(input: ScoringInput): ScoringOutput {
  const axes = computeAxisScores(input.axisIds, input.questions, input.answers)
  const parties = computePartyMatches(input.partyIds, axes, input.partyPositions)
  const explanations = buildExplanations(input.partyIds, axes, input.partyPositions)
  const quality = evaluateQuality(input.questions, input.answers)

  return { axes, parties, explanations, quality }
}

/**
 * Dikkat kontrolü maddeleri skor üretmez; yalnızca oturumun dikkatle
 * doldurulup doldurulmadığına dair bayrak üretir (rapor §5.3).
 * Yanıtlanmamış bir dikkat kontrolü "kaldı" sayılmaz.
 */
function evaluateQuality(questions: ScorableQuestion[], answers: UserAnswer[]): QualityFlags {
  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]))
  const checks = questions.filter((question) => question.type === 'attention_check')

  let failed = 0

  for (const check of checks) {
    const answer = answerByQuestion.get(check.id)
    if (!answer || !check.expectedValue) continue
    if (answer.value.trim() !== check.expectedValue) failed += 1
  }

  return { attentionChecksTotal: checks.length, attentionChecksFailed: failed }
}
