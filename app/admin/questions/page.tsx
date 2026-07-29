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
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Sorular</h1>
      <p className="mb-6 text-sm text-gray-600">
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
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {model.name}
              {model.is_active && (
                <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[11px] text-green-800">
                  aktif
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="text-gray-600">Yükleniyor...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-md">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Kod</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Soru</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tip</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Puanlama
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {questions.map((question) => (
                <tr key={question.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{question.order_index}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{question.code ?? '—'}</td>
                  <td className="max-w-md px-4 py-3 text-sm text-gray-900">{question.text}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{question.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {question.is_scored ? (
                      <>
                        {ruleCounts[question.id] ?? 0} kural
                        {Number(question.weight) !== 1 && ` · ağırlık ${question.weight}`}
                        {question.max_contribution !== null && ` · maks ${question.max_contribution}`}
                      </>
                    ) : (
                      <span className="text-gray-400">puanlanmaz</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/admin/questions/${question.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      İncele
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {questions.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              {selectedModel ? `${selectedModel.name} için soru bulunamadı.` : 'Eksen modeli seçilmedi.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
