'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { ReadOnlyNotice } from '@/components/admin/ReadOnlyNotice'

interface Question {
  id: string
  code: string | null
  text: string
  type: string
  required: boolean
  is_scored: boolean
  weight: number
  max_contribution: number | null
  order_index: number
  axis_model_id: string | null
}

interface AxisModel {
  id: string
  name: string
  version: string
  is_active: boolean
}

export default function QuestionsPage() {
  const [models, setModels] = useState<AxisModel[]>([])
  const [selectedModelId, setSelectedModelId] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [ruleCounts, setRuleCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchModels = async () => {
      const { data, error } = await supabase
        .from('axis_models')
        .select('id, name, version, is_active')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching axis models:', error)
        setErrorMessage('Eksen modelleri yüklenemedi')
        setLoading(false)
        return
      }

      const list = (data ?? []) as AxisModel[]
      setModels(list)
      setSelectedModelId(list.find((model) => model.is_active)?.id ?? list[0]?.id ?? '')
    }

    fetchModels()
  }, [])

  const fetchQuestions = useCallback(async () => {
    if (!selectedModelId) return

    setLoading(true)
    try {
      setErrorMessage('')
      const { data, error } = await supabase
        .from('questions')
        .select(
          'id, code, text, type, required, is_scored, weight, max_contribution, order_index, axis_model_id'
        )
        .eq('axis_model_id', selectedModelId)
        .order('order_index', { ascending: true })

      if (error) throw error

      const list = (data ?? []) as Question[]
      setQuestions(list)

      if (list.length === 0) {
        setRuleCounts({})
        return
      }

      const { data: rules } = await supabase
        .from('scoring_rules')
        .select('question_id')
        .in(
          'question_id',
          list.map((question) => question.id)
        )

      const counts: Record<string, number> = {}
      for (const rule of rules ?? []) {
        counts[rule.question_id] = (counts[rule.question_id] ?? 0) + 1
      }
      setRuleCounts(counts)
    } catch (error) {
      console.error('Error fetching questions:', error)
      setErrorMessage('Sorular yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [selectedModelId])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const selectedModel = models.find((model) => model.id === selectedModelId)

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-ink-primary">Sorular</h1>
      <p className="mb-6 text-sm text-ink-secondary">
        Anket yalnızca <strong>aktif</strong> eksen modelinin sorularını gösterir; diğer sürümler
        arşivdir.
      </p>

      <ReadOnlyNotice source="scripts/data/axis-model-v2.js" command="npm run v2:seed" />

      {models.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {models.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => setSelectedModelId(model.id)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                model.id === selectedModelId
                  ? 'border-ink-primary bg-ink-primary text-white'
                  : 'border-border-strong bg-surface-card text-ink-primary hover:border-ink-muted'
              }`}
            >
              {model.name}
              {model.is_active && (
                <span className="ml-2 rounded-badge bg-accent-tint px-1.5 py-0.5 text-[11px] text-accent-hover">
                  aktif
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-badge border border-border-strong border-l-4 border-l-ink-primary bg-surface-muted p-3 text-sm text-ink-primary">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="text-ink-secondary">Yükleniyor...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-surface-card border border-border">
          <table className="min-w-full">
            <thead className="bg-surface">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-ink-secondary">#</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-ink-secondary">Kod</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-ink-secondary">Soru</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-ink-secondary">Tip</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-ink-secondary">
                  Puanlama
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-ink-secondary" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {questions.map((question) => (
                <tr key={question.id} className="hover:bg-surface">
                  <td className="data-figure px-4 py-3 text-sm text-ink-secondary">{question.order_index}</td>
                  <td className="px-4 py-3 data-figure text-xs text-ink-secondary">{question.code ?? '—'}</td>
                  <td className="max-w-md px-4 py-3 text-sm text-ink-primary">{question.text}</td>
                  <td className="px-4 py-3 text-sm text-ink-secondary">{question.type}</td>
                  <td className="px-4 py-3 text-sm text-ink-secondary">
                    {question.is_scored ? (
                      <>
                        {ruleCounts[question.id] ?? 0} kural
                        {Number(question.weight) !== 1 && ` · ağırlık ${question.weight}`}
                        {question.max_contribution !== null && ` · maks ${question.max_contribution}`}
                      </>
                    ) : (
                      <span className="text-ink-muted">puanlanmaz</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/admin/questions/${question.id}`}
                      className="text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      İncele
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {questions.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-ink-secondary">
              {selectedModel ? `${selectedModel.name} için soru bulunamadı.` : 'Eksen modeli seçilmedi.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
