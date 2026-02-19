'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'

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

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId')
    if (!sessionId) {
      router.push('/consent')
      return
    }

    fetchQuestions()
  }, [router])

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*, question_options(*)')
        .order('order_index', { ascending: true })

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: value
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Yükleniyor...</div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-700 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Soru {currentQuestion + 1} / {questions.length}
          </p>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {question.description && (
            <p className="text-gray-600 mb-4">{question.description}</p>
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {question.text}
          </h2>

          {/* Render options based on question type */}
          <div className="space-y-3 mb-8">
            {question.question_options?.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option.value)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  answers[question.id] === option.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {option.text}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Önceki
            </button>
            <button
              onClick={handleNext}
              disabled={!answers[question.id] && question.required}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestion === questions.length - 1 ? 'Sonuçları Gör' : 'Sonraki'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
