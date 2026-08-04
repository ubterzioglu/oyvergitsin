'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type SubjectTable =
  | 'public_people'
  | 'political_affiliation_events'
  | 'journalist_status_events'
  | 'public_data_evidence'
  | 'election_results_by_area'

interface PendingItem {
  id: string
  table: SubjectTable
  title: string
  subtitle: string
  sourceUrl?: string
  createdAt?: string
}

interface ScanOutcome {
  source: string
  fetched: number
  inserted: number
  updated: number
  skipped: number
  failed: boolean
  errorMessage: string | null
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleString('tr-TR')
}

export default function AdminSiyasetRadariPage() {
  const [items, setItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [manualForm, setManualForm] = useState({
    fullName: '',
    fromPartyName: '',
    toPartyName: '',
    province: '',
    happenedOn: '',
    sourceName: '',
    sourceUrl: '',
    summary: '',
    xHandle: '',
  })

  const fetchPending = async () => {
    setLoading(true)
    try {
      const [people, political, journalists, evidence, election] = await Promise.all([
        supabase
          .from('public_people')
          .select('id, full_name, primary_role, province, created_at')
          .eq('review_status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('political_affiliation_events')
          .select('id, event_type, from_party_name, to_party_name, source_name, source_url, created_at, public_people(full_name)')
          .eq('review_status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('journalist_status_events')
          .select('id, outlet, job_title, status_label, source_name, source_url, created_at, public_people(full_name)')
          .eq('review_status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('public_data_evidence')
          .select('id, source_name, source_url, title, subject_type, created_at')
          .eq('review_status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('election_results_by_area')
          .select('id, party_name, area_name, seat_count, source_name, source_url, created_at')
          .eq('review_status', 'pending')
          .order('created_at', { ascending: false }),
      ])

      const nextItems: PendingItem[] = [
        ...((people.data ?? []) as any[]).map((row) => ({
          id: row.id,
          table: 'public_people' as const,
          title: row.full_name,
          subtitle: `${row.primary_role}${row.province ? ` · ${row.province}` : ''}`,
          createdAt: row.created_at,
        })),
        ...((political.data ?? []) as any[]).map((row) => ({
          id: row.id,
          table: 'political_affiliation_events' as const,
          title: row.public_people?.full_name ?? 'Parti geçiş kaydı',
          subtitle: `${row.event_type}: ${row.from_party_name ?? '—'} -> ${row.to_party_name ?? '—'} · ${row.source_name}`,
          sourceUrl: row.source_url,
          createdAt: row.created_at,
        })),
        ...((journalists.data ?? []) as any[]).map((row) => ({
          id: row.id,
          table: 'journalist_status_events' as const,
          title: row.public_people?.full_name ?? 'Gazeteci durum kaydı',
          subtitle: `${row.status_label}${row.outlet ? ` · ${row.outlet}` : ''}${row.job_title ? ` · ${row.job_title}` : ''} · ${row.source_name}`,
          sourceUrl: row.source_url,
          createdAt: row.created_at,
        })),
        ...((evidence.data ?? []) as any[]).map((row) => ({
          id: row.id,
          table: 'public_data_evidence' as const,
          title: row.title ?? row.source_name,
          subtitle: `${row.subject_type} · ${row.source_name}`,
          sourceUrl: row.source_url,
          createdAt: row.created_at,
        })),
        ...((election.data ?? []) as any[]).map((row) => ({
          id: row.id,
          table: 'election_results_by_area' as const,
          title: `${row.party_name} · ${row.area_name}`,
          subtitle: `${row.seat_count ?? '—'} sandalye · ${row.source_name}`,
          sourceUrl: row.source_url,
          createdAt: row.created_at,
        })),
      ].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

      setItems(nextItems)
    } catch (error) {
      console.error('Pending records error:', error)
      setMessage('Kuyruk yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const runScan = async (source: 'all' | 'tbmm' | 'journalists') => {
    setScanning(true)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/siyaset-radari/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      })
      const payload = await response.json()
      if (!response.ok) {
        setMessage(payload.error ?? 'Tarama başarısız oldu.')
        return
      }
      const outcomes = payload.summary.outcomes as ScanOutcome[]
      setMessage(
        outcomes
          .map((outcome) => `${outcome.source}: ${outcome.fetched} bulundu, ${outcome.inserted} eklendi, ${outcome.updated} güncellendi`)
          .join(' · ')
      )
      await fetchPending()
    } catch (error) {
      console.error('Scan error:', error)
      setMessage('Tarama sırasında beklenmeyen bir hata oluştu.')
    } finally {
      setScanning(false)
    }
  }

  const review = async (item: PendingItem, action: 'approve' | 'reject' | 'archive') => {
    setBusyId(item.id)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/siyaset-radari/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectTable: item.table, subjectId: item.id, action }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setMessage(payload.error ?? 'İşlem başarısız oldu.')
        return
      }
      setItems((prev) => prev.filter((candidate) => candidate.id !== item.id))
    } catch (error) {
      console.error('Review error:', error)
      setMessage('İşlem sırasında beklenmeyen bir hata oluştu.')
    } finally {
      setBusyId(null)
    }
  }

  const submitManualPoliticalEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    try {
      const response = await fetch('/api/admin/siyaset-radari/political-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualForm),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setMessage(payload.error ?? 'Kayıt oluşturulamadı.')
        return
      }
      setManualForm({
        fullName: '',
        fromPartyName: '',
        toPartyName: '',
        province: '',
        happenedOn: '',
        sourceName: '',
        sourceUrl: '',
        summary: '',
        xHandle: '',
      })
      setMessage('Parti geçişi onay kuyruğuna eklendi.')
      await fetchPending()
    } catch (error) {
      console.error('Manual political event error:', error)
      setMessage('Kayıt oluşturulurken beklenmeyen bir hata oluştu.')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Siyaset Radarı</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kamu verisi adayları yayınlanmadan önce burada onaylanır.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => runScan('tbmm')}
            disabled={scanning}
            className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 disabled:opacity-50"
          >
            TBMM Tara
          </button>
          <button
            onClick={() => runScan('journalists')}
            disabled={scanning}
            className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 disabled:opacity-50"
          >
            Gazeteci Tara
          </button>
          <button
            onClick={() => runScan('all')}
            disabled={scanning}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {scanning ? 'Taranıyor...' : 'Tümünü Tara'}
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      <form onSubmit={submitManualPoliticalEvent} className="mb-8 rounded-lg bg-white p-6 shadow-md">
        <h2 className="text-xl font-bold text-gray-900">Parti Geçişi Adayı Ekle</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            Ad Soyad
            <input
              value={manualForm.fullName}
              onChange={(event) => setManualForm((prev) => ({ ...prev, fullName: event.target.value }))}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            İl
            <input
              value={manualForm.province}
              onChange={(event) => setManualForm((prev) => ({ ...prev, province: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Önceki Parti
            <input
              value={manualForm.fromPartyName}
              onChange={(event) => setManualForm((prev) => ({ ...prev, fromPartyName: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Yeni Parti / Bağımsız
            <input
              value={manualForm.toPartyName}
              onChange={(event) => setManualForm((prev) => ({ ...prev, toPartyName: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Tarih
            <input
              type="date"
              value={manualForm.happenedOn}
              onChange={(event) => setManualForm((prev) => ({ ...prev, happenedOn: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            X Handle
            <input
              value={manualForm.xHandle}
              onChange={(event) => setManualForm((prev) => ({ ...prev, xHandle: event.target.value }))}
              placeholder="@kullanici"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Kaynak Adı
            <input
              value={manualForm.sourceName}
              onChange={(event) => setManualForm((prev) => ({ ...prev, sourceName: event.target.value }))}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Kaynak URL
            <input
              type="url"
              value={manualForm.sourceUrl}
              onChange={(event) => setManualForm((prev) => ({ ...prev, sourceUrl: event.target.value }))}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-gray-700 md:col-span-2">
            Özet
            <textarea
              value={manualForm.summary}
              onChange={(event) => setManualForm((prev) => ({ ...prev, summary: event.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
        </div>
        <button type="submit" className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
          Adayı Kuyruğa Ekle
        </button>
      </form>

      {loading ? (
        <div className="text-gray-600">Yükleniyor...</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg bg-white px-6 py-10 text-center text-gray-500 shadow-md">
          Onay bekleyen kayıt yok.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={`${item.table}-${item.id}`} className="rounded-lg bg-white p-6 shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {item.table}
                  </div>
                  <h2 className="mt-1 text-lg font-semibold text-gray-900">{item.title}</h2>
                  <p className="mt-1 text-sm text-gray-600">{item.subtitle}</p>
                  <p className="mt-2 text-xs text-gray-500">{formatDate(item.createdAt)}</p>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-blue-700 hover:text-blue-900"
                    >
                      Kaynağı aç
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => review(item, 'approve')}
                    disabled={busyId === item.id}
                    className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Onayla
                  </button>
                  <button
                    onClick={() => review(item, 'reject')}
                    disabled={busyId === item.id}
                    className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Reddet
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
