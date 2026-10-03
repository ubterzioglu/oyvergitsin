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
      <h1 className="mb-2 text-3xl font-bold text-ink-primary">Cevaplar</h1>
      <p className="mb-6 text-sm text-ink-secondary">
        Anketi dolduran oturumlar ve verdikleri cevaplar. Oturumlar anonimdir: kimlik, e-posta veya
        konum bilgisi toplanmaz; IP ve cihaz bilgisi yalnızca hash olarak saklanır ve burada
        gösterilmez.
      </p>

      <div className="mb-4 flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-primary">
          <input
            type="checkbox"
            checked={onlyCompleted}
            onChange={(event) => setOnlyCompleted(event.target.checked)}
            className="h-4 w-4 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          />
          Yalnızca tamamlananlar
        </label>
        <span className="data-figure text-xs text-ink-secondary">son {PAGE_SIZE} oturum</span>
      </div>

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
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-ink-secondary">
                  Başlangıç
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-ink-secondary">Durum</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-ink-secondary">Cevap</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-ink-secondary">
                  Onay sürümü
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-ink-secondary" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-surface">
                  <td className="data-figure whitespace-nowrap px-4 py-3 text-sm text-ink-primary">
                    {new Date(session.created_at).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {session.completed_at ? (
                      <span className="rounded-badge bg-accent-tint px-2 py-0.5 text-xs text-accent-hover">
                        tamamlandı
                      </span>
                    ) : (
                      <span className="rounded-badge bg-surface-muted px-2 py-0.5 text-xs text-ink-secondary">
                        yarım
                      </span>
                    )}
                  </td>
                  <td className="data-figure px-4 py-3 text-sm text-ink-primary">{answerCounts[session.id] ?? 0}</td>
                  <td className="data-figure px-4 py-3 text-sm text-ink-secondary">v{session.consent_version}</td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/admin/responses/${session.id}`}
                      className="text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      Cevapları gör
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sessions.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-ink-secondary">Oturum bulunamadı.</div>
          )}
        </div>
      )}
    </div>
  )
}
