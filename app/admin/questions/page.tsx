'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { ReorderButtons } from '@/components/admin/ReorderButtons'
import { QUESTION_TYPES } from '@/lib/admin/questionTypes'

interface Question {
  id: string
  text: string
  type: string
  required: boolean
  order_index: number
}

export default function QuestionsPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      setErrorMessage('')
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('order_index', { ascending: true })

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
      setErrorMessage('Sorular yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert({
          text: 'Yeni soru',
          type: QUESTION_TYPES[0].value,
          required: true,
          order_index: questions.length + 1,
        })
        .select()
        .single()

      if (error) throw error
      router.push(`/admin/questions/${data.id}`)
    } catch (error) {
      console.error('Error creating question:', error)
      setErrorMessage('Yeni soru oluşturulamadı.')
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      const { error } = await supabase.from('questions').delete().eq('id', deleteTarget.id)
      if (error) throw error
      setDeleteTarget(null)
      await fetchQuestions()
    } catch (error) {
      console.error('Error deleting question:', error)
      setErrorMessage('Soru silinemedi.')
    } finally {
      setDeleting(false)
    }
  }

  const moveQuestion = async (question: Question, direction: 'up' | 'down') => {
    const sorted = [...questions].sort((a, b) => a.order_index - b.order_index)
    const index = sorted.findIndex((q) => q.id === question.id)
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sorted.length) return

    const neighbor = sorted[swapIndex]

    try {
      await Promise.all([
        supabase.from('questions').update({ order_index: neighbor.order_index }).eq('id', question.id),
        supabase.from('questions').update({ order_index: question.order_index }).eq('id', neighbor.id),
      ])
      await fetchQuestions()
    } catch (error) {
      console.error('Error reordering questions:', error)
      setErrorMessage('Sıralama güncellenemedi.')
    }
  }

  const typeLabel = (value: string) =>
    QUESTION_TYPES.find((t) => t.value === value)?.label ?? value

  if (loading) {
    return <div className="text-gray-600">Yükleniyor...</div>
  }

  const sortedQuestions = [...questions].sort((a, b) => a.order_index - b.order_index)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sorular</h1>
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? 'Oluşturuluyor...' : 'Yeni Soru Ekle'}
        </Button>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sıra
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Soru
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tip
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Zorunlu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedQuestions.map((question, index) => (
              <tr key={question.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    <ReorderButtons
                      onMoveUp={() => moveQuestion(question, 'up')}
                      onMoveDown={() => moveQuestion(question, 'down')}
                      disableUp={index === 0}
                      disableDown={index === sortedQuestions.length - 1}
                    />
                    {question.order_index}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{question.text}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded">{typeLabel(question.type)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {question.required ? 'Evet' : 'Hayır'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link href={`/admin/questions/${question.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                    Düzenle
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(question)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteTarget ? (
        <ConfirmDialog
          title="Soruyu sil"
          message={`"${deleteTarget.text}" sorusunu silmek istediğinize emin misiniz? Bu soruya bağlı seçenekler ve puanlama kuralları da silinecektir.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      ) : null}
    </div>
  )
}
