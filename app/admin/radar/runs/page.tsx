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
  completed: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  running: 'bg-blue-100 text-blue-800'
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
    return <div className="text-gray-600">Yükleniyor...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tarama Geçmişi</h1>
        <a
          href="/admin/radar"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Adaylar
        </a>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlangıç</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tetik</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kaynak</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bulundu</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eklendi</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tekrar</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Elendi</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hatalı Kaynak</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hata</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {runs.map((run) => (
              <tr key={run.id}>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(run.started_at)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{run.trigger_type}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_CLASSES[run.status] || 'bg-gray-100 text-gray-600'}`}>
                    {run.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{run.source_count}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{run.fetched_count}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{run.inserted_count}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{run.duplicate_count}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{run.filtered_count}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{run.failed_source_count}</td>
                <td className="px-4 py-3 text-sm text-red-600 max-w-xs truncate">{run.error_message || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
