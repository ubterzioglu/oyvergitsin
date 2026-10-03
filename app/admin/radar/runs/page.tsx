'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface ScanRun {
  id: string
  started_at: string
  trigger_type: string
  status: string
  source_count: number
  fetched_count: number
  inserted_count: number
  duplicate_count: number
  filtered_count: number
  failed_source_count: number
  error_message: string | null
}

function formatDate(value: string | null): string {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('tr-TR')
}

const STATUS_CLASSES: Record<string, string> = {
  completed: 'bg-accent-tint text-accent-hover',
  partial: 'bg-surface-muted text-ink-primary',
  failed: 'bg-surface-muted text-ink-primary',
  running: 'bg-accent-tint text-accent-hover'
}

export default function RadarRunsPage() {
  const [runs, setRuns] = useState<ScanRun[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const { data, error } = await supabase
          .from('news_scan_runs')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(100)

        if (error) throw error
        setRuns((data as ScanRun[]) || [])
      } catch (err) {
        console.error('Error fetching scan runs:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRuns()
  }, [])

  if (loading) {
    return <div className="text-ink-secondary">Yükleniyor...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-ink-primary">Tarama Geçmişi</h1>
        <a
          href="/admin/radar"
          className="px-4 py-2 bg-border text-ink-primary rounded-lg hover:bg-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Adaylar
        </a>
      </div>

      <div className="bg-surface-card rounded-lg border border-border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-surface">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ink-secondary uppercase tracking-wider">Başlangıç</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ink-secondary uppercase tracking-wider">Tetik</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ink-secondary uppercase tracking-wider">Durum</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ink-secondary uppercase tracking-wider">Kaynak</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ink-secondary uppercase tracking-wider">Bulundu</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ink-secondary uppercase tracking-wider">Eklendi</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ink-secondary uppercase tracking-wider">Tekrar</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ink-secondary uppercase tracking-wider">Elendi</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ink-secondary uppercase tracking-wider">Hatalı Kaynak</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ink-secondary uppercase tracking-wider">Hata</th>
            </tr>
          </thead>
          <tbody className="bg-surface-card divide-y divide-border">
            {runs.map((run) => (
              <tr key={run.id}>
                <td className="data-figure px-4 py-3 whitespace-nowrap text-sm text-ink-primary">{formatDate(run.started_at)}</td>
                <td className="data-figure px-4 py-3 whitespace-nowrap text-sm text-ink-secondary">{run.trigger_type}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-badge text-xs font-semibold ${STATUS_CLASSES[run.status] || 'bg-surface-muted text-ink-secondary'}`}>
                    {run.status}
                  </span>
                </td>
                <td className="data-figure px-4 py-3 whitespace-nowrap text-sm text-ink-secondary">{run.source_count}</td>
                <td className="data-figure px-4 py-3 whitespace-nowrap text-sm text-ink-secondary">{run.fetched_count}</td>
                <td className="data-figure px-4 py-3 whitespace-nowrap text-sm text-ink-secondary">{run.inserted_count}</td>
                <td className="data-figure px-4 py-3 whitespace-nowrap text-sm text-ink-secondary">{run.duplicate_count}</td>
                <td className="data-figure px-4 py-3 whitespace-nowrap text-sm text-ink-secondary">{run.filtered_count}</td>
                <td className="data-figure px-4 py-3 whitespace-nowrap text-sm text-ink-secondary">{run.failed_source_count}</td>
                <td className="px-4 py-3 text-sm text-ink-primary max-w-xs truncate">{run.error_message || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
