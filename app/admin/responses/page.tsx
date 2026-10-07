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
  risk_score?: number
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
          .select('id, created_at, completed_at, is_guest, consent_version, risk_score')
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

  const handleExportCsv = () => {
    if (sessions.length === 0) return

    const headers = ['Oturum ID', 'Baslangic', 'Tamamlanma', 'Cevap Sayisi', 'Risk Skoru', 'Onay Surumu']
    const rows = sessions.map((s) => [
      s.id,
      `"${new Date(s.created_at).toISOString()}"`,
      s.completed_at ? `"${new Date(s.completed_at).toISOString()}"` : '""',
      answerCounts[s.id] ?? 0,
      s.risk_score ?? 0,
      `"v${s.consent_version}"`
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `oyvergitsin_oturumlar_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-ink-primary">Cevaplar</h1>
          <p className="text-sm text-ink-secondary">
            Anketi dolduran oturumlar ve verdikleri cevaplar. Oturumlar anonimdir: kimlik, e-posta veya
            konum bilgisi toplanmaz; IP ve cihaz bilgisi yalnızca hash olarak saklanır.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={sessions.length === 0}
          className="mt-4 sm:mt-0 shrink-0 inline-flex items-center gap-2 rounded-button bg-surface-muted border border-border px-4 py-2 text-sm font-semibold text-ink-primary hover:bg-border transition-colors disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-currentColor" strokeWidth={2}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          CSV İndir
        </button>
      </div>

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
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-ink-secondary">Risk Skoru</th>
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
                  <td className="px-4 py-3 text-sm">
                    {(session.risk_score ?? 0) >= 50 ? (
                      <span className="rounded-badge bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                        {session.risk_score} (yüksek)
                      </span>
                    ) : (session.risk_score ?? 0) > 0 ? (
                      <span className="rounded-badge bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                        {session.risk_score} (orta)
                      </span>
                    ) : (
                      <span className="data-figure text-xs text-ink-secondary">0</span>
                    )}
                  </td>
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
