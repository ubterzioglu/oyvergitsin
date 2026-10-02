import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { QuestionRenderer } from '@/components/survey/QuestionRenderer'
import type { Question } from '@/components/survey/QuestionRenderer'

/**
 * attention_check sorusu komşu Likert sorularıyla aynı ölçekle render
 * edilmeli. Canlı verideki 17. sorunun seçenek kümesi birebir kullanıldı:
 * 5'li Likert + "Fikrim yok". Puanlama bu koldan etkilenmez (is_scored:
 * false, NON_SCORED_TYPES ve lib/scoring zaten ayrı ele alıyor).
 */

const OPTIONS = [
  { id: 'o1', text: 'Kesinlikle katılmıyorum', value: 'strongly_disagree', order_index: 0 },
  { id: 'o2', text: 'Katılmıyorum', value: 'disagree', order_index: 1 },
  { id: 'o3', text: 'Kararsızım', value: 'neutral', order_index: 2 },
  { id: 'o4', text: 'Katılıyorum', value: 'agree', order_index: 3 },
  { id: 'o5', text: 'Kesinlikle katılıyorum', value: 'strongly_agree', order_index: 4 },
  { id: 'o6', text: 'Fikrim yok', value: 'no_opinion', order_index: 5 },
]

const noop = () => {}

function questionFor(type: string): Question {
  return {
    id: 'q17',
    type,
    text: 'Bu soru dikkat kontrolü içindir. Lütfen "Katılmıyorum" seçeneğini işaretleyin.',
    required: true,
    order_index: 17,
    expected_value: type === 'attention_check' ? 'disagree' : null,
    question_options: OPTIONS,
  }
}

function render(question: Question, value = '') {
  return renderToStaticMarkup(
    <QuestionRenderer
      question={question}
      value={value}
      onAnswer={noop}
      onSingleSelectAnswer={noop}
    />
  )
}

describe('attention_check render kolu', () => {
  it('likert_5 ile birebir aynı gövdeyi render eder', () => {
    expect(render(questionFor('attention_check'))).toBe(render(questionFor('likert_5')))
  })

  it('likert_7 ile de aynı gövdeyi render eder', () => {
    expect(render(questionFor('attention_check'))).toBe(render(questionFor('likert_7')))
  })

  it('ölçek kutuları aria-pressed taşır, "Fikrim yok" ölçekle birlikte render edilir', () => {
    const markup = render(questionFor('attention_check'))

    expect(markup).toContain('aria-pressed="false"')
    expect(markup).toContain('Katılmıyorum')
    expect(markup).toContain('Fikrim yok')
    expect(markup.match(/aria-pressed=/g)).toHaveLength(OPTIONS.length)
  })

  it('seçili değer aria-pressed olarak yansır', () => {
    const markup = render(questionFor('attention_check'), 'disagree')

    expect(markup).toContain('aria-pressed="true"')
  })
})
