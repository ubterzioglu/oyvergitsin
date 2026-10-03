'use client'

import { RankingQuestion } from '@/components/survey/RankingQuestion'
import { MatrixQuestion } from '@/components/survey/MatrixQuestion'
import { LikertScale } from '@/components/survey/LikertScale'
import { SliderQuestion } from '@/components/survey/SliderQuestion'
import { NumericInput } from '@/components/survey/NumericInput'
import { AllocationQuestion } from '@/components/survey/AllocationQuestion'
import { OpenTextInput } from '@/components/survey/OpenTextInput'
import { DateInput } from '@/components/survey/DateInput'
import { FileUploadInput } from '@/components/survey/FileUploadInput'
import { ConsentCheckboxGroup } from '@/components/survey/ConsentCheckboxGroup'
import { CaptchaPlaceholder } from '@/components/survey/CaptchaPlaceholder'
import { ImageChoiceQuestion } from '@/components/survey/ImageChoiceQuestion'
import { VignetteLikert } from '@/components/survey/VignetteLikert'

// "Fikrim yok" ölçeğin bir kutusu değildir; ayrı bir kontrol olarak render
// edilir ve puanlama kuralı olmadığı için skordan tamamen düşer.
const NO_OPINION_VALUE = 'no_opinion'

export interface QuestionOption {
  id: string
  text: string
  value: string
  order_index: number
  image_url?: string | null
}

export interface Question {
  id: string
  text: string
  type: string
  description?: string | null
  required: boolean
  order_index: number
  vignette_text?: string | null
  expected_value?: string | null
  question_options?: QuestionOption[]
}

// Matrix ve vignette gibi iki boyutlu sorular için question_options.value
// "row:slug" / "col:slug" öneki taşır (bkz. seed.js). Bu, şemaya yeni kolon
// eklemeden satır/sütun ayrımını mevcut düz tablo üzerinde temsil eder.
// "Fikrim yok" ölçek kutularından ayrılır: nötr ile karıştırılmaması gerekiyor
// (metodoloji raporu §1-03). Puanlama kuralı olmadığı için skora da girmez.
function splitNoOpinion(options: QuestionOption[]) {
  return {
    scale: options.filter((option) => option.value !== NO_OPINION_VALUE),
    noOpinion: options.find((option) => option.value === NO_OPINION_VALUE),
  }
}

function splitMatrixOptions(options: QuestionOption[]) {
  const rows = options
    .filter((o) => o.value.startsWith('row:'))
    .map((o) => ({ ...o, value: o.value.slice(4) }))
  const columns = options
    .filter((o) => o.value.startsWith('col:'))
    .map((o) => ({ ...o, value: o.value.slice(4) }))
  return { rows, columns }
}

function parseJsonAnswer<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

interface QuestionRendererProps {
  question: Question
  value: string | undefined
  onAnswer: (value: string) => void
  onSingleSelectAnswer: (value: string) => void
}

export function QuestionRenderer({ question, value, onAnswer, onSingleSelectAnswer }: QuestionRendererProps) {
  const rawAnswer = value
  const handleAnswer = onAnswer
  const handleSingleSelectAnswer = onSingleSelectAnswer
  const options = question.question_options ?? []

  switch (question.type) {
    case 'ranking': {
      if (!options.length) {
        return (
          <p className="mb-8 text-sm text-ink-secondary">
            Bu soru için sıralanacak seçenek tanımlanmamış.
          </p>
        )
      }
      return (
        <RankingQuestion
          options={options}
          order={rawAnswer ? rawAnswer.split(',') : []}
          onChange={(order) => handleAnswer(order.join(','))}
        />
      )
    }

    case 'matrix_single':
    case 'matrix_multi': {
      const { rows, columns } = splitMatrixOptions(options)
      if (!rows.length || !columns.length) {
        return (
          <p className="mb-8 text-sm text-ink-secondary">
            Bu soru için satır/sütun tanımlanmamış.
          </p>
        )
      }
      const matrixValue = parseJsonAnswer<Record<string, string[]>>(rawAnswer, {})
      return (
        <MatrixQuestion
          rows={rows}
          columns={columns}
          multi={question.type === 'matrix_multi'}
          value={matrixValue}
          onChange={(next) => handleAnswer(JSON.stringify(next))}
        />
      )
    }

    // Dikkat kontrolü komşu Likert sorularıyla aynı ölçekle render edilir;
    // puanlamaya girmez (is_scored: false, NON_SCORED_TYPES ve lib/scoring
    // ayrıca ele alıyor) — bu kol yalnızca sunum katmanı.
    case 'attention_check':
    case 'likert_5':
    case 'likert_7': {
      const { scale, noOpinion } = splitNoOpinion(options)
      return (
        <LikertScale
          options={noOpinion ? [...scale, noOpinion] : scale}
          value={rawAnswer ?? ''}
          onChange={handleSingleSelectAnswer}
        />
      )
    }

    case 'vignette_likert': {
      const { scale, noOpinion } = splitNoOpinion(options)
      return (
        <VignetteLikert
          vignetteText={question.vignette_text ?? question.description ?? ''}
          options={noOpinion ? [...scale, noOpinion] : scale}
          value={rawAnswer ?? ''}
          onChange={handleSingleSelectAnswer}
        />
      )
    }

    case 'slider_0_100':
      return (
        <SliderQuestion
          value={rawAnswer ? Number(rawAnswer) : 50}
          onChange={(next) => handleAnswer(String(next))}
        />
      )

    case 'numeric_input':
      return <NumericInput value={rawAnswer ?? ''} onChange={handleAnswer} />

    case 'allocation': {
      const allocationValue = parseJsonAnswer<Record<string, number>>(rawAnswer, {})
      return (
        <AllocationQuestion
          items={options}
          value={allocationValue}
          onChange={(next) => handleAnswer(JSON.stringify(next))}
        />
      )
    }

    case 'open_text_short':
      return <OpenTextInput value={rawAnswer ?? ''} onChange={handleAnswer} maxLength={200} />

    case 'open_text_long':
      return <OpenTextInput value={rawAnswer ?? ''} long onChange={handleAnswer} />

    case 'date_input':
      return <DateInput value={rawAnswer ?? ''} onChange={handleAnswer} />

    case 'file_upload':
      return <FileUploadInput fileName={rawAnswer ?? ''} onChange={handleAnswer} />

    case 'consent_checkbox_group': {
      const consentValue = parseJsonAnswer<string[]>(rawAnswer, [])
      return (
        <ConsentCheckboxGroup
          options={options}
          value={consentValue}
          onChange={(next) => handleAnswer(JSON.stringify(next))}
        />
      )
    }

    case 'captcha_placeholder':
      return (
        <CaptchaPlaceholder
          checked={rawAnswer === 'confirmed'}
          onChange={(checked) => handleAnswer(checked ? 'confirmed' : '')}
        />
      )

    case 'image_choice_single':
    case 'image_choice_multi': {
      const imageValue = parseJsonAnswer<string[]>(rawAnswer, rawAnswer ? [rawAnswer] : [])
      return (
        <ImageChoiceQuestion
          options={options}
          multi={question.type === 'image_choice_multi'}
          value={imageValue}
          onChange={(next) => {
            if (question.type === 'image_choice_multi') {
              handleAnswer(JSON.stringify(next))
              return
            }
            handleSingleSelectAnswer(next[0] ?? '')
          }}
        />
      )
    }

    case 'multi_choice':
    case 'dropdown_multi':
    case 'scenario_multi': {
      const multiValue = parseJsonAnswer<string[]>(rawAnswer, [])
      return (
        <div className="mb-8 space-y-3">
          {options.map((option) => {
            const selected = multiValue.includes(option.value)
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  const next = selected
                    ? multiValue.filter((v) => v !== option.value)
                    : [...multiValue, option.value]
                  handleAnswer(JSON.stringify(next))
                }}
                className={`w-full rounded-button border-2 p-4 text-left text-ink-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                  selected
                    ? 'border-accent bg-accent-tint font-medium'
                    : 'border-border bg-surface-card hover:border-border-strong hover:shadow-soft'
                }`}
              >
                {option.text}
              </button>
            )
          })}
        </div>
      )
    }

    case 'dropdown_single':
      return (
        <select
          value={rawAnswer ?? ''}
          onChange={(e) => handleSingleSelectAnswer(e.target.value)}
          className="mb-8 w-full rounded-button border-2 border-border bg-surface-card p-4 text-ink-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="" disabled>
            Seçiniz
          </option>
          {options.map((option) => (
            <option key={option.id} value={option.value}>
              {option.text}
            </option>
          ))}
        </select>
      )

    default:
      return (
        <div className="mb-8 space-y-3">
          {options.map((option) => {
            const selected = rawAnswer === option.value
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => handleSingleSelectAnswer(option.value)}
                className={`w-full rounded-button border-2 p-4 text-left text-ink-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                  selected
                    ? 'border-accent bg-accent-tint font-medium'
                    : 'border-border bg-surface-card hover:border-border-strong hover:shadow-soft'
                }`}
              >
                {option.text}
              </button>
            )
          })}
        </div>
      )
  }
}
