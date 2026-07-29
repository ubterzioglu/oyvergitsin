'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface SessionRow {
  id: string
  created_at: string
  completed_at: string | null
  consent_version: number
}

interface AnswerRow {
  question_id: string
  answer_value: string
  is_important: boolean
}

interface QuestionRow {
  id: string
  code: string | null
  text: string
  type: string
  is_scored: boolean
  order_index: number
}

interface OptionRow {
  question_id: string
  text: string
  value: string
}

interface SnapshotRow {
  algorithm_version: number
  axis_scores: Record<string, number | null> | null
  party_similarities: Record<string, number | null> | null
  axis_coverage: Record<string, number> | null
  quality_flags: { attentionChecksTotal: number; attentionChecksFailed: number } | null
}

export default function ResponseDetailPage() {
  const params = useParams()
  const sessionId = String(params.sessionId ?? '')

  const [session, setSession] = useState<SessionRow | null>(null)
  const [answers, setAnswers] = useState<AnswerRow[]>([])
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [options, setOptions] = useState<OptionRow[]>([])
  const [snapshot, setSnapshot] = useState<SnapshotRow | null>(null)
  const [axisNames, setAxisNames] = useState<Record<string, string>>({})
  const [partyNames, setPartyNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchAll = useCallback(async () => {
    try {
      setErrorMessage('')

      const [sessionRes, answersRes, snapshotRes] = await Promise.all([
        supabase
          .from('sessions')
          .select('id, created_at, completed_at, consent_version')
          .eq('id', sessionId)
          .single(),
        supabase
          .from('answers')
          .select('question_id, answer_value, is_important')
          .eq('session_id', sessionId),
        supabase
          .from('result_snapshots')
          .select('algorithm_version, axis_scores, party_similarities, axis_coverage, quality_flags')
          .eq('session_id', sessionId)
          .maybeSingle(),
      ])

      if (sessionRes.error) throw sessionRes.error

      setSession(sessionRes.data as SessionRow)
      const answerList = (answersRes.data ?? []) as AnswerRow[]
      setAnswers(answerList)
      setSnapshot((snapshotRes.data ?? null) as SnapshotRow | null)

      if (answerList.length > 0) {
        const questionIds = answerList.map((answer) => answer.question_id)
        const [questionsRes, optionsRes] = await Promise.all([
          supabase
            .from('questions')
            .select('id, code, text, type, is_scored, order_index')
            .in('id', questionIds)
            .order('order_index', { ascending: true }),
          supabase.from('question_options').select('question_id, text, value').in('question_id', questionIds),
        ])

        setQuestions((questionsRes.data ?? []) as QuestionRow[])
        setOptions((optionsRes.data ?? []) as OptionRow[])
      }

      const snapshotData = snapshotRes.data as SnapshotRow | null
      if (snapshotData) {
        const axisIds = Object.keys(snapshotData.axis_scores ?? {})
        const partyIds = Object.keys(snapshotData.party_similarities ?? {})

        const [axesRes, partiesRes] = await Promise.all([
          axisIds.length > 0
            ? supabase.from('axes').select('id, name').in('id', axisIds)
            : Promise.resolve({ data: [] }),
          partyIds.length > 0
            ? supabase.from('parties').select('id, name').in('id', partyIds)
            : Promise.resolve({ data: [] }),
        ])

        setAxisNames(Object.fromEntries((axesRes.data ?? []).map((axis) => [axis.id, axis.name])))
        setPartyNames(Object.fromEntries((partiesRes.data ?? []).map((party) => [party.id, party.name])))
      }
    } catch (error) {
      console.error('Error fetching response:', error)
      setErrorMessage('Oturum yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (sessionId) fetchAll()
  }, [sessionId, fetchAll])

  if (loading) return <div className="text-gray-600">Yükleniyor...</div>

  if (errorMessage || !session) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {errorMessage || 'Oturum bulunamadı.'}
      </div>
    )
  }

  const answerByQuestion = new Map(answers.map((answer) => [answer.question_id, answer]))
  const optionLabel = (questionId: string, value: string) =>
    options.find((option) => option.question_id === questionId && option.value === value)?.text ?? value

  const sortedParties = Object.entries(snapshot?.party_similarities ?? {}).sort(
    (a, b) => (b[1] ?? -1) - (a[1] ?? -1)
  )

  return (
    <div>
      <Link href="/admin/responses" className="text-sm text-blue-600 hover:underline">
        ← Cevaplar
      </Link>

      <h1 className="mb-1 mt-2 text-3xl font-bold text-gray-900">Oturum</h1>
      <p className="mb-6 font-mono text-xs text-gray-500">{session.id}</p>

      <section className="mb-6 rounded-lg bg-white p-6 shadow-md">
        <dl className="grid gap-3 text-sm sm:grid-cols-4">
          <Field label="Başlangıç" value={new Date(session.created_at).toLocaleString('tr-TR')} />
          <Field
            label="Tamamlanma"
            value={session.completed_at ? new Date(session.completed_at).toLocaleString('tr-TR') : 'yarım kaldı'}
          />
          <Field label="Cevap sayısı" value={String(answers.length)} />
          <Field label="Onay sürümü" value={`v${session.consent_version}`} />
          {snapshot && <Field label="Algoritma" value={`v${snapshot.algorithm_version}`} />}
          {snapshot?.quality_flags && (
            <Field
              label="Dikkat kontrolü"
              value={
                snapshot.quality_flags.attentionChecksTotal === 0
                  ? 'yok'
                  : `${snapshot.quality_flags.attentionChecksFailed}/${snapshot.quality_flags.attentionChecksTotal} kaldı`
              }
            />
          )}
        </dl>
      </section>

      <section className="mb-6 rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Verilen cevaplar</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">#</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Soru</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Cevap</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Önem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {questions.map((question) => {
                const answer = answerByQuestion.get(question.id)
                if (!answer) return null

                return (
                  <tr key={question.id}>
                    <td className="px-3 py-2 text-sm text-gray-500">{question.order_index}</td>
                    <td className="max-w-md px-3 py-2 text-sm text-gray-900">
                      {question.text}
                      {!question.is_scored && (
                        <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">
                          puanlanmaz
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {optionLabel(question.id, answer.answer_value)}
                      <span className="ml-2 font-mono text-[11px] text-gray-400">
                        {answer.answer_value}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {answer.is_important ? (
                        <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-800">
                          önemli
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {answers.length === 0 && <p className="py-4 text-sm text-gray-500">Bu oturumda cevap yok.</p>}
      </section>

      {snapshot && (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Eksen skorları</h2>
            <ul className="space-y-2 text-sm">
              {Object.entries(snapshot.axis_scores ?? {}).map(([axisId, score]) => (
                <li key={axisId} className="flex items-center justify-between gap-3">
                  <span className="text-gray-700">{axisNames[axisId] ?? axisId}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums text-gray-900">
                      {score === null ? 'veri yok' : score}
                    </span>
                    {snapshot.axis_coverage?.[axisId] !== undefined && (
                      <span className="text-xs text-gray-400">
                        %{Math.round(snapshot.axis_coverage[axisId] * 100)} kapsama
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Parti eşleşmeleri</h2>
            <ul className="space-y-2 text-sm">
              {sortedParties.map(([partyId, similarity]) => (
                <li key={partyId} className="flex items-center justify-between gap-3">
                  <span className="text-gray-700">{partyNames[partyId] ?? partyId}</span>
                  <span className="font-semibold tabular-nums text-gray-900">
                    {similarity === null ? 'konum yok' : `%${similarity}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {!snapshot && (
        <p className="rounded-lg bg-white p-6 text-sm text-gray-500 shadow-md">
          Bu oturum tamamlanmadığı için sonuç hesaplanmadı.
        </p>
      )}
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
