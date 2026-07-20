'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { RankingQuestion } from '@/components/survey/RankingQuestion'

const RAINBOW_ACCENTS = ['#F5C518', '#F5821F', '#E8385C', '#7B4FE0', '#1E9BE0', '#3CB043']

interface Question {
  id: string
  text: string
  type: string
  description?: string | null
  required: boolean
  order_index: number
  question_options?: Array<{
    id: string
    text: string
    value: string
    order_index: number
  }>
}

export default function SurveyPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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

  const handleAnswer = (value: string) => {
    const question = questions[currentQuestion]
    if (!question) return

    setAnswers(prev => ({
      ...prev,
      [question.id]: value
    }))
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
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

      const answerArray = Object.entries(answers).map(([questionId, value]) => ({
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
          {question.description && (
            <p className="mb-3 text-ink-secondary">{question.description}</p>
          )}
          <h2 className="mb-5 font-heading text-2xl font-semibold text-ink-primary">
            {question.text}
          </h2>

          <div className="flex-1 flex flex-col justify-center">
            {question.type === 'ranking' && question.question_options?.length ? (
              <RankingQuestion
                options={question.question_options}
                order={answers[question.id] ? answers[question.id].split(',') : []}
                onChange={(order) => handleAnswer(order.join(','))}
              />
            ) : question.type === 'ranking' ? (
              <p className="mb-8 text-sm text-ink-secondary">
                Bu soru için sıralanacak seçenek tanımlanmamış.
              </p>
            ) : (
              <div className="mb-8 space-y-3">
                {question.question_options?.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option.value)}
                    className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                      answers[question.id] === option.value
                        ? 'border-rainbow-blue bg-surface-muted'
                        : 'border-border hover:border-border-strong'
                    }`}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto flex justify-between">
            <Button onClick={handlePrevious} disabled={currentQuestion === 0} variant="secondary">
              Önceki
            </Button>
            <Button
              onClick={handleNext}
              disabled={!answers[question.id] && question.required}
              variant="primary"
            >
              {currentQuestion === questions.length - 1 ? 'Sonuçları Gör' : 'Sonraki'}
            </Button>
          </div>
        </Card>

        <div className="mt-4 flex w-full max-w-xl flex-wrap justify-center gap-1.5">
          {questions.map((q, index) => {
            const isActive = index === currentQuestion
            const isAnswered = Boolean(answers[q.id])
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentQuestion(index)}
                aria-label={`Soru ${index + 1}`}
                aria-current={isActive}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'text-white shadow-soft ring-2 ring-offset-1'
                    : isAnswered
                      ? 'bg-surface-muted text-ink-primary hover:bg-border'
                      : 'bg-surface-card text-ink-secondary shadow-soft hover:text-ink-primary'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: RAINBOW_ACCENTS[index % RAINBOW_ACCENTS.length],
                        ['--tw-ring-color' as string]: RAINBOW_ACCENTS[index % RAINBOW_ACCENTS.length],
                      }
                    : undefined
                }
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
