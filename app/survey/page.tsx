'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'
import { ProgressBar } from '@/components/ui/ProgressBar'
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

const RAINBOW_ACCENTS = ['#F5C518', '#F5821F', '#E8385C', '#7B4FE0', '#1E9BE0', '#3CB043']

// Tek seçimle tamamlanan sorularda kullanıcı şıkkı işaretledikten sonra
// seçimin vurgulandığını görebilsin diye kısa bir gecikmeyle ilerlenir.
const AUTO_ADVANCE_DELAY_MS = 280

interface QuestionOption {
  id: string
  text: string
  value: string
  order_index: number
  image_url?: string | null
}

// Matrix ve vignette gibi iki boyutlu sorular için question_options.value
// "row:slug" / "col:slug" öneki taşır (bkz. seed.js). Bu, şemaya yeni kolon
// eklemeden satır/sütun ayrımını mevcut düz tablo üzerinde temsil eder.
function splitMatrixOptions(options: QuestionOption[]) {
  const rows = options
    .filter((o) => o.value.startsWith('row:'))
    .map((o) => ({ ...o, value: o.value.slice(4) }))
  const columns = options
    .filter((o) => o.value.startsWith('col:'))
    .map((o) => ({ ...o, value: o.value.slice(4) }))
  return { rows, columns }
}

interface Question {
  id: string
  text: string
  type: string
  description?: string | null
  required: boolean
  order_index: number
  vignette_text?: string | null
  question_options?: QuestionOption[]
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

function isAnswerFilled(questionType: string, raw: string | undefined): boolean {
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

export default function SurveyPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId')
    if (!sessionId) {
      router.push('/consent')
      return
    }

    fetchQuestions()
  }, [router])

  useEffect(() => {
    const rankingDefaults: Record<string, string> = {}
    questions.forEach((question) => {
      if (question.type === 'ranking' && question.question_options?.length) {
        rankingDefaults[question.id] = question.question_options
          .map((option) => option.value)
          .join(',')
      }
    })

    if (Object.keys(rankingDefaults).length > 0) {
      setAnswers((prev) => ({ ...rankingDefaults, ...prev }))
    }
  }, [questions])

  const fetchQuestions = async () => {
    try {
      setErrorMessage('')
      const response = await fetch('/api/questions', { cache: 'no-store' })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Sorular yuklenemedi')
      }

      setQuestions(payload.questions || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
      setErrorMessage('Anket sorulari yuklenemedi. Lutfen biraz sonra tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const cancelScheduledAdvance = () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }

  useEffect(() => cancelScheduledAdvance, [])

  const handleAnswer = (value: string) => {
    const question = questions[currentQuestion]
    if (!question) return

    setAnswers(prev => ({
      ...prev,
      [question.id]: value
    }))
  }

  // Tek seçimlik sorularda şık işaretlenir işaretlenmez sonraki soruya geçilir.
  // Son soruda otomatik gönderim yapılmaz; kullanıcı butonla onaylar.
  const handleSingleSelectAnswer = (value: string) => {
    handleAnswer(value)

    if (!value || currentQuestion >= questions.length - 1) return

    cancelScheduledAdvance()
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null
      setCurrentQuestion((index) => Math.min(index + 1, questions.length - 1))
    }, AUTO_ADVANCE_DELAY_MS)
  }

  const goToQuestion = (index: number) => {
    cancelScheduledAdvance()
    setCurrentQuestion(index)
  }

  const handleNext = () => {
    cancelScheduledAdvance()
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    cancelScheduledAdvance()
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const sessionId = localStorage.getItem('sessionId')
      if (!sessionId) {
        router.push('/consent')
        return
      }

      const answerArray = Object.entries(answers)
        .filter(([, value]) => value.length > 0)
        .map(([questionId, value]) => ({
          questionId,
          value
        }))

      await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answers: answerArray })
      })

      await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      router.push(`/results/${sessionId}`)
    } catch (error) {
      console.error('Error submitting survey:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-ink-secondary">Yükleniyor...</div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{errorMessage}</p>
          <button
            onClick={fetchQuestions}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-lg border border-border bg-surface-card p-6 text-center">
          <p className="text-sm text-ink-secondary">Gosterilecek soru bulunamadi.</p>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100
  const rawAnswer = answers[question.id]

  const renderQuestionBody = () => {
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

      case 'likert_5':
      case 'likert_7':
        return (
          <LikertScale options={options} value={rawAnswer ?? ''} onChange={handleSingleSelectAnswer} />
        )

      case 'vignette_likert':
        return (
          <VignetteLikert
            vignetteText={question.vignette_text ?? question.description ?? ''}
            options={options}
            value={rawAnswer ?? ''}
            onChange={handleSingleSelectAnswer}
          />
        )

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
                  onClick={() => {
                    const next = selected
                      ? multiValue.filter((v) => v !== option.value)
                      : [...multiValue, option.value]
                    handleAnswer(JSON.stringify(next))
                  }}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    selected ? 'border-rainbow-blue bg-surface-muted' : 'border-border hover:border-border-strong'
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
            className="mb-8 w-full rounded-lg border-2 border-border p-4 text-ink-primary focus:border-rainbow-blue focus:outline-none"
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
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSingleSelectAnswer(option.value)}
                className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                  rawAnswer === option.value
                    ? 'border-rainbow-blue bg-surface-muted'
                    : 'border-border hover:border-border-strong'
                }`}
              >
                {option.text}
              </button>
            ))}
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-4 sm:py-6">
      <Container size="md" className="flex flex-col items-center">
        <div className="mb-4 w-full max-w-xl sm:mb-5">
          <ProgressBar progress={progress} label={`Soru ${currentQuestion + 1} / ${questions.length}`} />
        </div>

        <Card
          elevated
          className="flex w-full max-w-xl min-h-[40rem] flex-col border-t-4"
          style={{ borderTopColor: RAINBOW_ACCENTS[currentQuestion % RAINBOW_ACCENTS.length] }}
        >
          {question.description && question.type !== 'vignette_likert' && (
            <p className="mb-3 text-ink-secondary">{question.description}</p>
          )}
          <h2 className="mb-5 font-heading text-2xl font-semibold text-ink-primary">
            {question.text}
          </h2>

          <div className="flex-1 flex flex-col justify-center">{renderQuestionBody()}</div>

          <div className="mt-auto flex justify-between">
            <Button onClick={handlePrevious} disabled={currentQuestion === 0} variant="secondary">
              Önceki
            </Button>
            <Button
              onClick={handleNext}
              disabled={question.required && !isAnswerFilled(question.type, rawAnswer)}
              variant="primary"
            >
              {currentQuestion === questions.length - 1 ? 'Sonuçları Gör' : 'Sonraki'}
            </Button>
          </div>
        </Card>

        <div className="mt-4 flex w-full max-w-xl flex-wrap justify-center gap-1.5">
          {questions.map((q, index) => {
            const isActive = index === currentQuestion
            const isAnswered = isAnswerFilled(q.type, answers[q.id])
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => goToQuestion(index)}
                aria-label={`Soru ${index + 1}`}
                aria-current={isActive}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white transition-colors duration-300 ${
                  isActive ? 'shadow-soft ring-2 ring-offset-1' : 'shadow-soft'
                }`}
                style={{
                  backgroundColor: isActive
                    ? RAINBOW_ACCENTS[index % RAINBOW_ACCENTS.length]
                    : isAnswered
                      ? '#3CB043'
                      : '#E8385C',
                  ['--tw-ring-color' as string]: isActive
                    ? RAINBOW_ACCENTS[index % RAINBOW_ACCENTS.length]
                    : undefined,
                }}
              >
                {index + 1}
              </button>
            )
          })}
        </div>
      </Container>
    </div>
  )
}
