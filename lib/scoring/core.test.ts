import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { calculate } from './core'
import { LIKERT_MAX, LIKERT_SCORES } from './likert'
import { answer, likertQuestion, question } from './test-helpers'
import type { PartyPosition } from './types'

const EKONOMI = 'axis-ekonomi'
const CEVRE = 'axis-cevre'

describe('uçtan uca hesaplama', () => {
  const questions = [
    likertQuestion('e1', EKONOMI),
    likertQuestion('e2', EKONOMI),
    likertQuestion('e3', EKONOMI, { reversed: true }),
    likertQuestion('c1', CEVRE),
    likertQuestion('c2', CEVRE),
    likertQuestion('c3', CEVRE),
  ]

  const positions: PartyPosition[] = [
    { partyId: 'sol', axisId: EKONOMI, score: 80 },
    { partyId: 'sol', axisId: CEVRE, score: 80 },
    { partyId: 'sag', axisId: EKONOMI, score: -80 },
    { partyId: 'sag', axisId: CEVRE, score: -80 },
  ]

  it('tutarlı sol cevaplar sol partiyi öne çıkarır', () => {
    const result = calculate({
      axisIds: [EKONOMI, CEVRE],
      questions,
      answers: [
        answer('e1', 'strongly_agree'),
        answer('e2', 'strongly_agree'),
        answer('e3', 'strongly_disagree'),
        answer('c1', 'strongly_agree'),
        answer('c2', 'strongly_agree'),
        answer('c3', 'strongly_agree'),
      ],
      partyIds: ['sol', 'sag'],
      partyPositions: positions,
    })

    const bySimilarity = [...result.parties].sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))

    expect(bySimilarity[0].partyId).toBe('sol')
    expect(result.axes.every((axis) => axis.score === 100)).toBe(true)
  })

  it('tüm cevaplar fikrim yok ise hiçbir eksen skor üretmez ve eşleşme null olur', () => {
    const result = calculate({
      axisIds: [EKONOMI, CEVRE],
      questions,
      answers: questions.map((q) => answer(q.id, 'no_opinion')),
      partyIds: ['sol', 'sag'],
      partyPositions: positions,
    })

    expect(result.axes.every((axis) => axis.score === null)).toBe(true)
    expect(result.parties.every((party) => party.similarity === null)).toBe(true)
  })

  it('hiç cevap yoksa çökmez', () => {
    const result = calculate({
      axisIds: [EKONOMI, CEVRE],
      questions,
      answers: [],
      partyIds: ['sol', 'sag'],
      partyPositions: positions,
    })

    expect(result.axes).toHaveLength(2)
    expect(result.parties.every((party) => party.similarity === null)).toBe(true)
  })

  it('parti listesi boşken çökmez', () => {
    const result = calculate({
      axisIds: [EKONOMI],
      questions,
      answers: [answer('e1', 'agree')],
      partyIds: [],
      partyPositions: [],
    })

    expect(result.parties).toEqual([])
    expect(result.explanations).toEqual([])
  })
})

describe('dikkat kontrolü', () => {
  const attentionCheck = question({
    id: 'dikkat',
    type: 'attention_check',
    isScored: false,
    expectedValue: 'disagree',
    rules: [],
  })

  function run(answers: Parameters<typeof calculate>[0]['answers']) {
    return calculate({
      axisIds: [EKONOMI],
      questions: [likertQuestion('e1', EKONOMI), attentionCheck],
      answers,
      partyIds: [],
      partyPositions: [],
    }).quality
  }

  it('doğru cevap kaldı saymaz', () => {
    expect(run([answer('dikkat', 'disagree')])).toEqual({
      attentionChecksTotal: 1,
      attentionChecksFailed: 0,
    })
  })

  it('yanlış cevap kaldı sayılır', () => {
    expect(run([answer('dikkat', 'agree')])).toEqual({
      attentionChecksTotal: 1,
      attentionChecksFailed: 1,
    })
  })

  it('yanıtlanmamış dikkat kontrolü kaldı sayılmaz', () => {
    expect(run([])).toEqual({ attentionChecksTotal: 1, attentionChecksFailed: 0 })
  })

  it('dikkat kontrolü eksen skoruna karışmaz', () => {
    const result = calculate({
      axisIds: [EKONOMI],
      questions: [likertQuestion('e1', EKONOMI), attentionCheck],
      answers: [answer('e1', 'strongly_agree'), answer('dikkat', 'agree')],
      partyIds: [],
      partyPositions: [],
    })

    expect(result.axes[0].score).toBe(100)
    expect(result.axes[0].totalItems).toBe(1)
  })
})

describe('seed içeriği ile motor sabitleri aynı ölçeği kullanır', () => {
  it('scripts/data/axis-model-v2.js ile lib/scoring/likert.ts ayrışmamış', () => {
    const require = createRequire(import.meta.url)
    const seedData = require('../../scripts/data/axis-model-v2.js')

    expect(seedData.LIKERT_SCORES).toEqual(LIKERT_SCORES)
    expect(seedData.LIKERT_MAX_CONTRIBUTION).toBe(LIKERT_MAX)
  })

  it('24 puanlanan madde, 8 eksen, eksen başına 3 madde', () => {
    const require = createRequire(import.meta.url)
    const seedData = require('../../scripts/data/axis-model-v2.js')

    const scored = seedData.buildOrderedQuestions().filter((q: { is_scored: boolean }) => q.is_scored)
    expect(scored).toHaveLength(24)
    expect(seedData.AXES).toHaveLength(8)

    for (const axis of seedData.AXES) {
      const items = scored.filter((q: { axis: string }) => q.axis === axis.slug)
      expect(items, `${axis.slug} ekseninde 3 madde olmalı`).toHaveLength(3)
    }
  })

  it('her eksende en az bir ters kodlanmış madde var', () => {
    const require = createRequire(import.meta.url)
    const seedData = require('../../scripts/data/axis-model-v2.js')

    for (const axis of seedData.AXES) {
      const reversed = seedData.QUESTIONS.filter(
        (q: { axis: string; reversed: boolean }) => q.axis === axis.slug && q.reversed
      )
      expect(reversed.length, `${axis.slug} ekseninde ters kodlanmış madde yok`).toBeGreaterThan(0)
    }
  })

  it('fikrim yok için puanlama kuralı üretilmez', () => {
    const require = createRequire(import.meta.url)
    const seedData = require('../../scripts/data/axis-model-v2.js')

    const rules = seedData.buildScoringRules({ reversed: false })
    expect(rules.map((rule: { answer_value: string }) => rule.answer_value)).not.toContain('no_opinion')
    expect(rules).toHaveLength(5)
  })
})
