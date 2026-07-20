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
    return <div className="text-gray-600">Yükleniyor...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Haber Adayları</h1>
        <div className="flex gap-3">
          <a
            href="/admin/radar/sources"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Kaynaklar
          </a>
          <a
            href="/admin/radar/runs"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Tarama Geçmişi
          </a>
          <button
            onClick={runScan}
            disabled={scanning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {scanning ? 'Taranıyor...' : 'Şimdi Tara'}
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md px-6 py-10 text-center text-gray-500">
          Onay bekleyen haber adayı yok.
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <a
                    href={candidate.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-blue-700 hover:text-blue-900"
                  >
                    {candidate.title}
                  </a>
                  <div className="mt-1 text-sm text-gray-500">
                    {candidate.source_name} · {formatDate(candidate.published_at)}
                  </div>
                  {candidate.summary && (
                    <p className="mt-3 text-sm text-gray-700">{candidate.summary}</p>
                  )}
                </div>
                <span className="shrink-0 inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-bold">
                  {candidate.relevance_score}
                </span>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => performAction(candidate.id, 'approve')}
                  disabled={busyId === candidate.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Onayla
                </button>
                <button
                  onClick={() => performAction(candidate.id, 'reject')}
                  disabled={busyId === candidate.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Reddet
                </button>
                <button
                  onClick={() => performAction(candidate.id, 'duplicate')}
                  disabled={busyId === candidate.id}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
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
