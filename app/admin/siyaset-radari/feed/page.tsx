'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type ScanSource = 'news' | 'daily' | 'weekly'
type ReviewAction = 'approve' | 'reject' | 'archive'

interface FeedItem {
  id: string
  topic: string
  title: string
  description: string | null
  source_name: string
  article_url: string
  published_at: string | null
  discovered_at: string
}

interface ScanOutcome {
  source?: string
  fetched?: number
  inserted?: number
  updated?: number
  skipped?: number
  failed?: boolean
  errorMessage?: string | null
}

interface ScanRun {
  id: string
  requested_source: string
  trigger_source: string
  status: string
  started_at: string
  completed_at: string | null
  outcomes: ScanOutcome[] | null
  error_message: string | null
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('tr-TR')
}

function outcomeText(outcomes: ScanOutcome[] | null): string {
  if (!Array.isArray(outcomes) || outcomes.length === 0) return 'Sonuç bilgisi yok.'
  return outcomes
    .map((item) => {
      const counts = `${item.fetched ?? 0} bulundu, ${item.inserted ?? 0} yeni, ${item.updated ?? 0} güncel`
      return `${item.source ?? 'Kaynak'}: ${counts}${item.errorMessage ? ` · ${item.errorMessage}` : ''}`
    })
    .join(' | ')
}

export default function SiyasetRadariFeedAdminPage() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [runs, setRuns] = useState<ScanRun[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState<ScanSource | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [feedResult, runResult] = await Promise.all([
      supabase
        .from('radar_feed_items')
        .select('id, topic, title, description, source_name, article_url, published_at, discovered_at')
        .eq('review_status', 'pending')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('discovered_at', { ascending: false })
        .limit(100),
      supabase
        .from('radar_scan_runs')
        .select('id, requested_source, trigger_source, status, started_at, completed_at, outcomes, error_message')
        .order('started_at', { ascending: false })
        .limit(12),
    ])

    if (feedResult.error || runResult.error) {
      setMessage(feedResult.error?.message ?? runResult.error?.message ?? 'Veriler yüklenemedi.')
    }
    setItems((feedResult.data ?? []) as FeedItem[])
    setRuns((runResult.data ?? []) as ScanRun[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const scan = async (source: ScanSource) => {
    setScanning(source)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/siyaset-radari/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setMessage(payload.error ?? 'Tarama başarısız oldu.')
        return
      }
      setMessage(outcomeText(payload.summary?.outcomes ?? []))
      await load()
    } catch {
      setMessage('Tarama sırasında beklenmeyen bir hata oluştu.')
    } finally {
      setScanning(null)
    }
  }

  const review = async (item: FeedItem, action: ReviewAction) => {
    setBusyId(item.id)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/siyaset-radari/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectTable: 'radar_feed_items', subjectId: item.id, action }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setMessage(payload.error ?? 'İşlem başarısız oldu.')
        return
      }
      setItems((current) => current.filter((candidate) => candidate.id !== item.id))
    } catch {
      setMessage('İşlem sırasında beklenmeyen bir hata oluştu.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-surface-card p-6 border border-border">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink-primary">Radar Akışı</h1>
            <p className="mt-1 text-sm text-ink-secondary">
              Otomatik bulunan haberler onaylanmadan kamuya gösterilmez.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => scan('news')} disabled={Boolean(scanning)} className="rounded-lg bg-border px-4 py-2 text-sm font-semibold text-ink-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
              {scanning === 'news' ? 'Taranıyor...' : 'Sadece Haber Tara'}
            </button>
            <button onClick={() => scan('daily')} disabled={Boolean(scanning)} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
              {scanning === 'daily' ? 'Taranıyor...' : 'Günlük Taramayı Çalıştır'}
            </button>
            <button onClick={() => scan('weekly')} disabled={Boolean(scanning)} className="rounded-lg bg-accent-hover px-4 py-2 text-sm font-semibold text-white hover:bg-scale-6 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
              {scanning === 'weekly' ? 'Taranıyor...' : 'Haftalık Taramayı Çalıştır'}
            </button>
          </div>
        </div>
        {message && <div className="mt-4 rounded-lg border-l-4 border-accent bg-accent-tint px-4 py-3 text-sm text-accent-hover">{message}</div>}
      </section>

      <section>
        <h2 className="text-xl font-bold text-ink-primary">Onay Kuyruğu ({items.length})</h2>
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="text-ink-secondary">Yükleniyor...</div>
          ) : items.length === 0 ? (
            <div className="rounded-lg bg-surface-card px-6 py-10 text-center text-ink-secondary border border-border">Onay bekleyen haber yok.</div>
          ) : (
            items.map((item) => (
              <article key={item.id} className="rounded-lg bg-surface-card p-6 border border-border">
                <div className="flex flex-col justify-between gap-5 lg:flex-row">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">{item.topic}</div>
                    <h3 className="mt-1 text-lg font-semibold text-ink-primary">{item.title}</h3>
                    {item.description && <p className="mt-2 text-sm leading-6 text-ink-secondary">{item.description}</p>}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-secondary">
                      <span>{item.source_name}</span>
                      <span className="data-figure">Yayın: {formatDate(item.published_at)}</span>
                      <span className="data-figure">Bulundu: {formatDate(item.discovered_at)}</span>
                    </div>
                    <a href={item.article_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-accent-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                      Kaynağı aç
                    </a>
                  </div>
                  <div className="flex shrink-0 items-start gap-2">
                    <button onClick={() => review(item, 'approve')} disabled={busyId === item.id} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Onayla</button>
                    <button onClick={() => review(item, 'reject')} disabled={busyId === item.id} className="rounded-lg bg-ink-primary px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Reddet</button>
                    <button onClick={() => review(item, 'archive')} disabled={busyId === item.id} className="rounded-lg bg-border px-3 py-2 text-sm font-semibold text-ink-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Arşivle</button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg bg-surface-card p-6 border border-border">
        <h2 className="text-xl font-bold text-ink-primary">Son Tarama Çalışmaları</h2>
        <div className="mt-4 space-y-3">
          {runs.length === 0 ? (
            <p className="text-sm text-ink-secondary">Henüz tarama kaydı yok.</p>
          ) : (
            runs.map((run) => (
              <div key={run.id} className="border-b border-border pb-3 last:border-b-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-ink-primary">{run.requested_source} · {run.trigger_source}</span>
                  <span className="text-sm text-ink-secondary data-figure">{run.status} · {formatDate(run.started_at)}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-ink-secondary">{run.error_message ?? outcomeText(run.outcomes)}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
