'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface SessionRow {
  id: string
  created_at: string
  completed_at: string | null
  is_guest: boolean
  consent_version: number
}

const PAGE_SIZE = 50

export default function ResponsesPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [answerCounts, setAnswerCounts] = useState<Record<string, number>>({})
  const [onlyCompleted, setOnlyCompleted] = useState(true)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true)
      try {
        setErrorMessage('')

        let query = supabase
          .from('sessions')
          .select('id, created_at, completed_at, is_guest, consent_version')
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE)

        if (onlyCompleted) {
          query = query.not('completed_at', 'is', null)
        }

        const { data, error } = await query
        if (error) throw error

        const list = (data ?? []) as SessionRow[]
        setSessions(list)

        if (list.length === 0) {
          setAnswerCounts({})
          return
        }

        const { data: answers, error: answersError } = await supabase
          .from('answers')
          .select('session_id')
          .in(
            'session_id',
            list.map((session) => session.id)
          )

        if (answersError) throw answersError

        const counts: Record<string, number> = {}
        for (const answer of answers ?? []) {
          counts[answer.session_id] = (counts[answer.session_id] ?? 0) + 1
        }
        setAnswerCounts(counts)
      } catch (error) {
        console.error('Error fetching sessions:', error)
        setErrorMessage('Oturumlar yüklenemedi')
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [onlyCompleted])

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Cevaplar</h1>
      <p className="mb-6 text-sm text-gray-600">
        Anketi dolduran oturumlar ve verdikleri cevaplar. Oturumlar anonimdir: kimlik, e-posta veya
        konum bilgisi toplanmaz; IP ve cihaz bilgisi yalnızca hash olarak saklanır ve burada
        gösterilmez.
      </p>

      <div className="mb-4 flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={onlyCompleted}
            onChange={(event) => setOnlyCompleted(event.target.checked)}
            className="h-4 w-4"
          />
          Yalnızca tamamlananlar
        </label>
        <span className="text-xs text-gray-500">son {PAGE_SIZE} oturum</span>
      </div>

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
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Başlangıç
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Durum</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cevap</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Onay sürümü
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {new Date(session.created_at).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {session.completed_at ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        tamamlandı
                      </span>
                    ) : (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        yarım
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{answerCounts[session.id] ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">v{session.consent_version}</td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/admin/responses/${session.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Cevapları gör
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sessions.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">Oturum bulunamadı.</div>
          )}
        </div>
      )}
    </div>
  )
}
