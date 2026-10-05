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
    return <div className="text-ink-secondary">Yükleniyor...</div>
  }

  if (errorMessage || !question) {
    return (
      <div className="rounded-badge border border-border-strong border-l-4 border-l-ink-primary bg-surface-muted p-4 text-sm text-ink-primary">
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
      <Link href="/admin/questions" className="text-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
        ← Sorular
      </Link>

      <h1 className="mb-1 mt-2 text-3xl font-bold text-ink-primary">Soru {question.order_index}</h1>
      {question.code && <p className="mb-6 data-figure text-sm text-ink-secondary">{question.code}</p>}

      <ReadOnlyNotice source="scripts/data/axis-model-v2.js" command="npm run v2:seed" />

      <section className="mb-6 rounded-lg bg-surface-card p-6 border border-border">
        <h2 className="mb-4 text-lg font-semibold text-ink-primary">Madde</h2>
        <p className="mb-4 text-ink-primary">{question.text}</p>
        {question.description && <p className="mb-4 text-sm text-ink-secondary">{question.description}</p>}

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

      <section className="mb-6 rounded-lg bg-surface-card p-6 border border-border">
        <h2 className="mb-2 text-lg font-semibold text-ink-primary">Seçenekler ve puanlama</h2>
        <p className="mb-4 text-sm text-ink-secondary">
          Puanlama kuralı olmayan bir seçenek (örneğin &quot;Fikrim yok&quot;) skora hiç girmez: o
          madde hem paydan hem paydadan düşer. &quot;Kararsızım&quot; ise 0 puanlı gerçek bir
          cevaptır ve paydada kalır.
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-surface">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase text-ink-secondary">
                  Seçenek
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase text-ink-secondary">Değer</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase text-ink-secondary">Etki</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {options.map((option) => {
                const optionRules = rulesByValue.get(option.value) ?? []
                return (
                  <tr key={option.id}>
                    <td className="px-3 py-2 text-sm text-ink-primary">{option.text}</td>
                    <td className="px-3 py-2 data-figure text-xs text-ink-secondary">{option.value}</td>
                    <td className="px-3 py-2 text-sm text-ink-secondary">
                      {optionRules.length === 0 ? (
                        <span className="text-ink-muted">puanlamaya girmez</span>
                      ) : (
                        optionRules.map((rule) => (
                          <div key={rule.id}>
                            {axisName(rule.axis_id)}{' '}
                            <span
                              className={rule.score_modifier < 0 ? 'data-figure text-ink-primary' : 'data-figure text-accent-hover'}
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
          <p className="py-4 text-sm text-ink-secondary">Bu soru tipinde seçenek tanımlanmaz.</p>
        )}
      </section>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-ink-secondary">{label}</dt>
      <dd className="text-ink-primary">{value}</dd>
    </div>
  )
}
