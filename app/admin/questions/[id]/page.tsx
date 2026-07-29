'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { ReadOnlyNotice } from '@/components/admin/ReadOnlyNotice'

interface Question {
  id: string
  code: string | null
  text: string
  type: string
  description: string | null
  required: boolean
  is_scored: boolean
  weight: number
  max_contribution: number | null
  expected_value: string | null
  order_index: number
}

interface QuestionOption {
  id: string
  text: string
  value: string
  order_index: number
}

interface ScoringRule {
  id: string
  answer_value: string
  axis_id: string
  score_modifier: number
}

interface Axis {
  id: string
  name: string
  slug: string
}

export default function QuestionDetailPage() {
  const params = useParams()
  const questionId = String(params.id ?? '')

  const [question, setQuestion] = useState<Question | null>(null)
  const [options, setOptions] = useState<QuestionOption[]>([])
  const [rules, setRules] = useState<ScoringRule[]>([])
  const [axes, setAxes] = useState<Axis[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchAll = useCallback(async () => {
    try {
      setErrorMessage('')
      const [questionRes, optionsRes, rulesRes, axesRes] = await Promise.all([
        supabase.from('questions').select('*').eq('id', questionId).single(),
        supabase
          .from('question_options')
          .select('*')
          .eq('question_id', questionId)
          .order('order_index', { ascending: true }),
        supabase.from('scoring_rules').select('*').eq('question_id', questionId),
        supabase.from('axes').select('id, name, slug'),
      ])

      if (questionRes.error) throw questionRes.error

      setQuestion(questionRes.data as Question)
      setOptions((optionsRes.data ?? []) as QuestionOption[])
      setRules((rulesRes.data ?? []) as ScoringRule[])
      setAxes((axesRes.data ?? []) as Axis[])
    } catch (error) {
      console.error('Error fetching question:', error)
      setErrorMessage('Soru yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [questionId])

  useEffect(() => {
    if (questionId) fetchAll()
  }, [questionId, fetchAll])

  if (loading) {
    return <div className="text-gray-600">Yükleniyor...</div>
  }

  if (errorMessage || !question) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {errorMessage || 'Soru bulunamadı.'}
      </div>
    )
  }

  const axisName = (axisId: string) => axes.find((axis) => axis.id === axisId)?.name ?? axisId

  const rulesByValue = new Map<string, ScoringRule[]>()
  for (const rule of rules) {
    const current = rulesByValue.get(rule.answer_value) ?? []
    current.push(rule)
    rulesByValue.set(rule.answer_value, current)
  }

  return (
    <div>
      <Link href="/admin/questions" className="text-sm text-blue-600 hover:underline">
        ← Sorular
      </Link>

      <h1 className="mb-1 mt-2 text-3xl font-bold text-gray-900">Soru {question.order_index}</h1>
      {question.code && <p className="mb-6 font-mono text-sm text-gray-500">{question.code}</p>}

      <ReadOnlyNotice source="scripts/data/axis-model-v2.js" command="npm run v2:seed" />

      <section className="mb-6 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Madde</h2>
        <p className="mb-4 text-gray-900">{question.text}</p>
        {question.description && <p className="mb-4 text-sm text-gray-600">{question.description}</p>}

        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <Field label="Tip" value={question.type} />
          <Field label="Zorunlu" value={question.required ? 'evet' : 'hayır'} />
          <Field label="Puanlanıyor" value={question.is_scored ? 'evet' : 'hayır'} />
          <Field label="Ağırlık (w)" value={String(question.weight)} />
          <Field
            label="Maksimum katkı (M)"
            value={
              question.max_contribution === null
                ? 'kurallardan türetilir'
                : String(question.max_contribution)
            }
          />
          {question.expected_value && <Field label="Beklenen cevap" value={question.expected_value} />}
        </dl>
      </section>

      <section className="mb-6 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Seçenekler ve puanlama</h2>
        <p className="mb-4 text-sm text-gray-600">
          Puanlama kuralı olmayan bir seçenek (örneğin &quot;Fikrim yok&quot;) skora hiç girmez: o
          madde hem paydan hem paydadan düşer. &quot;Kararsızım&quot; ise 0 puanlı gerçek bir
          cevaptır ve paydada kalır.
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                  Seçenek
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Değer</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Etki</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {options.map((option) => {
                const optionRules = rulesByValue.get(option.value) ?? []
                return (
                  <tr key={option.id}>
                    <td className="px-3 py-2 text-sm text-gray-900">{option.text}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-600">{option.value}</td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {optionRules.length === 0 ? (
                        <span className="text-gray-400">puanlamaya girmez</span>
                      ) : (
                        optionRules.map((rule) => (
                          <div key={rule.id}>
                            {axisName(rule.axis_id)}{' '}
                            <span
                              className={rule.score_modifier < 0 ? 'text-red-600' : 'text-green-700'}
                            >
                              {rule.score_modifier > 0 ? '+' : ''}
                              {rule.score_modifier}
                            </span>
                          </div>
                        ))
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {options.length === 0 && (
          <p className="py-4 text-sm text-gray-500">Bu soru tipinde seçenek tanımlanmaz.</p>
        )}
      </section>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-gray-500">{label}</dt>
      <dd className="text-gray-900">{value}</dd>
    </div>
  )
}
