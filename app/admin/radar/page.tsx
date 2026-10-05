'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Candidate {
  id: string
  title: string
  source_name: string
  original_url: string
  summary: string | null
  relevance_score: number
  published_at: string | null
}

interface ScanSummary {
  status: string
  sourceCount: number
  fetchedCount: number
  insertedCount: number
  duplicateCount: number
  filteredCount: number
  failedSourceCount: number
}

function formatDate(value: string | null): string {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleString('tr-TR')
}

export default function RadarPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('news_candidates')
        .select('id, title, source_name, original_url, summary, relevance_score, published_at')
        .eq('review_status', 'pending')
        .order('relevance_score', { ascending: false })
        .order('published_at', { ascending: false, nullsFirst: false })

      if (error) throw error
      setCandidates((data as Candidate[]) || [])
    } catch (error) {
      console.error('Error fetching candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidates()
  }, [])

  const runScan = async () => {
    setScanning(true)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/radar/scan', { method: 'POST' })
      const payload = await response.json()
      if (!response.ok) {
        setMessage(payload.error || 'Tarama başarısız oldu.')
        return
      }
      const summary: ScanSummary = payload.summary
      setMessage(
        `Tarama tamamlandı (${summary.status}): ${summary.fetchedCount} bulundu, ` +
          `${summary.insertedCount} eklendi, ${summary.duplicateCount} tekrar, ` +
          `${summary.filteredCount} elendi, ${summary.failedSourceCount} kaynak hatası.`
      )
      await fetchCandidates()
    } catch (error) {
      console.error('Scan error:', error)
      setMessage('Tarama sırasında beklenmeyen bir hata oluştu.')
    } finally {
      setScanning(false)
    }
  }

  const performAction = async (id: string, action: 'approve' | 'reject' | 'duplicate') => {
    setBusyId(id)
    try {
      const response = await fetch(`/api/admin/radar/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        setMessage(payload.error || 'İşlem başarısız oldu.')
        return
      }
      await fetchCandidates()
    } catch (error) {
      console.error('Action error:', error)
      setMessage('İşlem sırasında beklenmeyen bir hata oluştu.')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <div className="text-ink-secondary">Yükleniyor...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-ink-primary">Haber Adayları</h1>
        <div className="flex gap-3">
          <a
            href="/admin/radar/sources"
            className="px-4 py-2 bg-border text-ink-primary rounded-lg hover:bg-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Kaynaklar
          </a>
          <a
            href="/admin/radar/runs"
            className="px-4 py-2 bg-border text-ink-primary rounded-lg hover:bg-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Tarama Geçmişi
          </a>
          <button
            onClick={runScan}
            disabled={scanning}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {scanning ? 'Taranıyor...' : 'Şimdi Tara'}
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-lg border-l-4 border-accent bg-accent-tint px-4 py-3 text-sm text-accent-hover">
          {message}
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="bg-surface-card rounded-lg border border-border px-6 py-10 text-center text-ink-secondary">
          Onay bekleyen haber adayı yok.
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="bg-surface-card rounded-lg border border-border p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <a
                    href={candidate.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-accent-hover hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    {candidate.title}
                  </a>
                  <div className="data-figure mt-1 text-sm text-ink-secondary">
                    {candidate.source_name} · {formatDate(candidate.published_at)}
                  </div>
                  {candidate.summary && (
                    <p className="mt-3 text-sm text-ink-primary">{candidate.summary}</p>
                  )}
                </div>
                <span className="shrink-0 inline-block px-3 py-1 data-figure rounded-full bg-surface-muted text-ink-primary text-sm font-bold">
                  {candidate.relevance_score}
                </span>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => performAction(candidate.id, 'approve')}
                  disabled={busyId === candidate.id}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  Onayla
                </button>
                <button
                  onClick={() => performAction(candidate.id, 'reject')}
                  disabled={busyId === candidate.id}
                  className="px-4 py-2 bg-ink-primary text-white rounded-lg hover:bg-scale-6 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  Reddet
                </button>
                <button
                  onClick={() => performAction(candidate.id, 'duplicate')}
                  disabled={busyId === candidate.id}
                  className="px-4 py-2 bg-border text-ink-primary rounded-lg hover:bg-border-strong disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  Tekrar (Duplicate)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
