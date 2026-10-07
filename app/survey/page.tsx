'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { QuestionRenderer } from '@/components/survey/QuestionRenderer'
import type { Question } from '@/components/survey/QuestionRenderer'
import { ImportanceToggle } from '@/components/survey/ImportanceToggle'
import { isSurveyAnswerFilled, validateSurveyCompletion } from '@/lib/survey/completion'

// B14: RAINBOW_ACCENTS dizisi tamamen kaldırıldı (devir belgesi §6.2).
// Yön A tek accent kullanıyor; döngüsel accent kavramı yok. Soru kartı artık
// renkli üst kenar taşımıyor — kartlar 1px kenarlıkla ayrışıyor, renk yalnızca
// etkileşim/selection durumlarında (petrol accent).

// Tek seçimle tamamlanan sorularda kullanıcı şıkkı işaretledikten sonra
// seçimin vurgulandığını görebilsin diye kısa bir gecikmeyle ilerlenir.
const AUTO_ADVANCE_DELAY_MS = 280

// Önem işareti yalnızca ideolojik skora giren maddelerde anlamlı.
const NON_SCORED_TYPES = new Set([
  'attention_check',
  'captcha_placeholder',
  'consent_checkbox_group',
  'date_input',
  'file_upload',
  'open_text_long',
  'open_text_short',
])

export default function SurveyPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [importance, setImportance] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [completionMessage, setCompletionMessage] = useState<string | null>(null)
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
        throw new Error(payload.error || 'Sorular yüklenemedi')
      }

      setQuestions(payload.questions || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
      setErrorMessage('Anket soruları yüklenemedi. Lütfen biraz sonra tekrar deneyin.')
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

  // Önem işareti soru kartının altında duruyor; otomatik ilerleme çalışırsa
  // kullanıcı işaretlemeye fırsat bulamadan sayfa değişirdi. Bu yüzden
  // işaretleme zamanlanmış geçişi iptal eder.
  const handleImportanceChange = (checked: boolean) => {
    const question = questions[currentQuestion]
    if (!question) return

    cancelScheduledAdvance()
    setImportance((prev) => ({ ...prev, [question.id]: checked }))
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
    const completion = validateSurveyCompletion(
      questions,
      Object.entries(answers).map(([questionId, value]) => ({ questionId, value }))
    )

    if (!completion.ok) {
      const firstInvalidIndex = questions.findIndex((question) => question.id === completion.firstInvalidQuestionId)
      if (firstInvalidIndex >= 0) {
        setCurrentQuestion(firstInvalidIndex)
      }

      setCompletionMessage(
        completion.failedAttentionQuestionIds.length > 0
          ? 'Tüm soruları doğru cevaplamalısınız. Dikkat kontrolü sorusunu yönergede belirtilen şekilde işaretleyin.'
          : 'Tüm soruları doğru cevaplamalısınız. Eksik soru bırakmadan devam edin.'
      )
      return
    }

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
          value,
          isImportant: importance[questionId] ?? false
        }))

      await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answers: answerArray })
      })

      const hpInput = document.getElementById('hp_website') as HTMLInputElement | null
      const hpWebsite = hpInput?.value || undefined

      await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, hp_website: hpWebsite })
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
        <div className="w-full max-w-xl rounded-card border border-border-strong bg-surface-card p-6 text-center">
          <p className="text-sm text-ink-primary">{errorMessage}</p>
          <Button onClick={fetchQuestions} variant="primary" className="mt-4 px-4 py-2 text-sm">
            Tekrar Dene
          </Button>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-card border border-border bg-surface-card p-6 text-center">
          <p className="text-sm text-ink-secondary">Gösterilecek soru bulunamadı.</p>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100
  const rawAnswer = answers[question.id]

  return (
    <div className="min-h-screen bg-surface px-2 py-2 sm:px-4 sm:py-6">
      <Container size="md" className="flex flex-col items-center px-2 sm:px-4">
        <div className="mb-3 w-full max-w-xl sm:mb-5">
          {/* Sayaçlar veri yazısında (mono + tabular): "doğrulanmış kamu
            verisi" hissi. ink-secondary/surface 6.00 — AA. */}
          <div className="mb-1.5 flex items-baseline justify-between sm:mb-2">
            <p className="data-figure text-sm text-ink-secondary sm:text-base">
              {`Soru ${currentQuestion + 1} / ${questions.length}`}
            </p>
            <p className="data-figure text-xs text-ink-secondary sm:text-sm">
              {`%${Math.round(progress)}`}
            </p>
          </div>
          <ProgressBar progress={progress} />
        </div>

        <Card className="flex w-full max-w-xl min-h-0 flex-col !p-4 sm:min-h-[30rem] sm:!p-8">
          {question.description && question.type !== 'vignette_likert' && (
            <p className="mb-2 text-sm text-ink-secondary sm:mb-3 sm:text-base">{question.description}</p>
          )}
          <h2 className="mb-4 font-heading text-xl font-semibold leading-snug text-ink-primary sm:mb-5 sm:text-2xl">
            {question.text}
          </h2>

          {/* Görünmez bot tuzağı (Honeypot): İnsan kullanıcılar görmez veya doldurmaz */}
          <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
            <label htmlFor="hp_website">Do not fill this field</label>
            <input
              id="hp_website"
              name="hp_website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <QuestionRenderer
              question={question}
              value={rawAnswer}
              onAnswer={handleAnswer}
              onSingleSelectAnswer={handleSingleSelectAnswer}
            />
          </div>

          {!NON_SCORED_TYPES.has(question.type) && (
            <ImportanceToggle
              checked={importance[question.id] ?? false}
              onChange={handleImportanceChange}
            />
          )}

          <div className="mt-auto flex justify-between pt-3 sm:pt-4">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              variant="secondary"
              className="px-5 py-2.5 text-sm sm:px-8 sm:py-3 sm:text-base"
            >
              Önceki
            </Button>
            <Button
              onClick={handleNext}
              disabled={question.required && !isSurveyAnswerFilled(question.type, rawAnswer)}
              variant="primary"
              className="px-5 py-2.5 text-sm sm:px-8 sm:py-3 sm:text-base"
            >
              {currentQuestion === questions.length - 1 ? 'Sonuçları Gör' : 'Sonraki'}
            </Button>
          </div>
        </Card>

        {/* Soru atlayıcı: cam efektli (backdrop-blur + yarı saydam beyaz)
            tepsi ve döngüsel rainbow halkası kaldırıldı — opak kart zemini +
            1px kenarlık. Durumlar: aktif = dolu petrol (beyaz/sayı 5.92),
            cevaplandı = accent-tint zemin + accent sayı (5.06), boş = kart
            zemini + ink-secondary sayı (6.38). Hepsi AA; sayı mono. */}
        <div className="mt-3 w-full max-w-xl sm:mt-4">
          <div className="mx-auto flex w-fit max-w-full flex-wrap justify-center gap-1 rounded-card border border-border bg-surface-card px-2 py-2 sm:gap-1.5 sm:px-3">
            {questions.map((q, index) => {
              const isActive = index === currentQuestion
              const isAnswered = isSurveyAnswerFilled(q.type, answers[q.id])
              const stateClass = isActive
                ? 'border-accent bg-accent text-white'
                : isAnswered
                  ? 'border-accent bg-accent-tint text-accent hover:bg-surface-muted'
                  : 'border-border-strong bg-surface-card text-ink-secondary hover:border-ink-muted hover:bg-surface-muted'
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => goToQuestion(index)}
                  aria-label={`Soru ${index + 1}${isAnswered ? ', cevaplandı' : ', cevaplanmadı'}`}
                  aria-current={isActive}
                  className={`data-figure flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:h-7 sm:w-7 sm:text-xs ${stateClass}`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </div>
      </Container>

      {completionMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/40 px-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="completion-alert-title"
            className="w-full max-w-sm rounded-card border border-border-strong bg-surface-card p-5 shadow-elevated"
          >
            <h2 id="completion-alert-title" className="text-lg font-semibold text-ink-primary">
              Anket tamamlanamadı
            </h2>
            <p className="mt-2 text-sm text-ink-secondary">{completionMessage}</p>
            <Button
              type="button"
              autoFocus
              onClick={() => setCompletionMessage(null)}
              variant="primary"
              className="mt-5 w-full px-4 py-2.5 text-sm"
            >
              Tamam
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
