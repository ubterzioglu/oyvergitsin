'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { EMPTY_EVIDENCE, EvidenceFields, type EvidenceDraft } from '@/components/admin/EvidenceFields'
import { diffPosition, type EvidenceItem } from '@/lib/content-review/position-diff'

interface Props {
  partyId: string
  axisId: string
  positionId: string | null
  /** Sunucudan geldiği gibi (mikrosaniyeli) geri gönderilir; çakışma kontrolü buna dayanır. */
  updatedAt: string | null
  initialScore: number | null
  initialEvidence: EvidenceItem[]
}

interface Draft {
  score: number
  evidence: EvidenceDraft[]
  note: string
  publicNote: string
  isPublic: boolean
}

const TEXT_CLASS =
  'w-full rounded-button border border-border-strong bg-white px-3 py-2 text-sm text-ink-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30'

function toDraft(item: EvidenceItem): EvidenceDraft {
  return {
    source_type: item.source_type,
    source_title: item.source_title ?? '',
    source_url: item.source_url ?? '',
    source_date: item.source_date ?? '',
    quote: item.quote ?? '',
    rationale: item.rationale ?? '',
  }
}

function toItem(draft: EvidenceDraft): EvidenceItem {
  const orNull = (value: string) => (value.trim() === '' ? null : value.trim())
  return {
    source_type: draft.source_type,
    source_title: draft.source_title.trim(),
    source_url: orNull(draft.source_url),
    source_date: orNull(draft.source_date),
    quote: orNull(draft.quote),
    rationale: draft.rationale.trim(),
  }
}

function isDraft(value: unknown): value is Draft {
  if (!value || typeof value !== 'object') return false
  const draft = value as Record<string, unknown>
  return (
    typeof draft.score === 'number' &&
    typeof draft.note === 'string' &&
    typeof draft.publicNote === 'string' &&
    typeof draft.isPublic === 'boolean' &&
    Array.isArray(draft.evidence) &&
    draft.evidence.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        ['source_type', 'source_title', 'source_url', 'source_date', 'quote', 'rationale'].every(
          (field) => typeof (item as Record<string, unknown>)[field] === 'string'
        )
    )
  )
}

// Bozuk ya da eski biçimli kayıt editörü çökertmesin; geçersizse yok sayılır.
function readStoredDraft(key: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(key)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    return isDraft(parsed) ? parsed : null
  } catch {
    return null
  }
}

function sameDraft(a: Draft, b: Draft): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function writeStoredDraft(key: string, draft: Draft | null) {
  try {
    if (draft) {
      window.localStorage.setItem(key, JSON.stringify(draft))
    } else {
      window.localStorage.removeItem(key)
    }
  } catch {
    // Depolama kapalıysa taslak yalnız bu sekmede yaşar; düzenleme yine çalışır.
  }
}

export function PositionEditor({ partyId, axisId, positionId, updatedAt, initialScore, initialEvidence }: Props) {
  const router = useRouter()
  // Taslak, sunucudaki sürüme bağlıdır: konum başka yerden değişince eski taslak geri gelmez.
  const storageKey = `position-draft:${partyId}:${axisId}:${updatedAt ?? 'new'}`
  const initialDraft = useMemo<Draft>(
    () => ({
      score: initialScore ?? 0,
      evidence: initialEvidence.length > 0 ? initialEvidence.map(toDraft) : [{ ...EMPTY_EVIDENCE }],
      note: '',
      publicNote: '',
      isPublic: true,
    }),
    [initialScore, initialEvidence]
  )

  const [draft, setDraft] = useState<Draft>(initialDraft)
  const [restored, setRestored] = useState(false)
  const [busy, setBusy] = useState<'publish' | 'verify' | null>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const stored = readStoredDraft(storageKey)
    if (stored) {
      setDraft(stored)
      setRestored(true)
    }
  }, [storageKey])

  useEffect(() => {
    // İçerik karşılaştırması: yeniden render'da oluşan yeni nesne "kaydedilmemiş taslak" sayılmasın.
    writeStoredDraft(storageKey, sameDraft(draft, initialDraft) ? null : draft)
  }, [storageKey, draft, initialDraft])

  const diff = useMemo(
    () =>
      diffPosition(
        { score: initialScore, evidence: initialEvidence },
        { score: draft.score, evidence: draft.evidence.map(toItem) }
      ),
    [initialScore, initialEvidence, draft.score, draft.evidence]
  )

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }))
  const setScore = (value: number) => update({ score: Math.max(-100, Math.min(100, Math.round(value || 0))) })
  const setEvidence = (index: number, next: EvidenceDraft) =>
    update({ evidence: draft.evidence.map((item, i) => (i === index ? next : item)) })

  const resetDraft = () => {
    setDraft(initialDraft)
    setRestored(false)
    writeStoredDraft(storageKey, null)
  }

  const post = async (url: string, body: unknown) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    if (!response.ok) {
      throw new Error(payload.error ?? 'İşlem başarısız oldu.')
    }
  }

  const publish = async () => {
    setBusy('publish')
    setMessage(null)
    try {
      await post('/api/admin/party-positions/publish', {
        partyId,
        axisId,
        expectedUpdatedAt: updatedAt,
        score: draft.score,
        evidence: draft.evidence.map(toItem),
        note: draft.note || undefined,
        publicNote: draft.publicNote || undefined,
        isPublic: draft.isPublic,
      })
      writeStoredDraft(storageKey, null)
      setMessage({ kind: 'ok', text: 'Yayınlandı. Yeni anket sonuçları bu konumla hesaplanacak.' })
      router.refresh()
    } catch (error) {
      const text = error instanceof Error ? error.message : 'İşlem başarısız oldu.'
      setMessage({
        kind: 'error',
        text: text.includes('değişti') || text.includes('silinmiş')
          ? `${text} Yenilemeden önce düzenlemenizi (özellikle kanıt metinlerini) bir yere kopyalayın.`
          : text,
      })
    } finally {
      setBusy(null)
    }
  }

  const verify = async () => {
    if (!positionId) return
    setBusy('verify')
    setMessage(null)
    try {
      await post('/api/admin/party-positions/verify', { positionId, note: draft.note || undefined })
      setMessage({ kind: 'ok', text: 'Doğrulandı; doğrulama tarihi bugüne çekildi.' })
      router.refresh()
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'İşlem başarısız oldu.' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      {restored && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border-strong bg-accent-tint p-3 text-sm text-ink-primary">
          <span>Kaydedilmemiş bir taslak geri yüklendi.</span>
          <button type="button" onClick={resetDraft} className="font-semibold text-accent hover:text-accent-hover">
            Taslağı at
          </button>
        </div>
      )}

      <section className="rounded-card border border-border bg-surface-card p-5">
        <label htmlFor="score" className="mb-2 block text-sm font-semibold text-ink-primary">
          Puan (−100 … 100)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={-100}
            max={100}
            value={draft.score}
            onChange={(event) => setScore(Number(event.target.value))}
            className="flex-1 accent-accent"
            aria-label="Puan kaydırıcısı"
          />
          <input
            id="score"
            type="number"
            min={-100}
            max={100}
            step={1}
            value={draft.score}
            onChange={(event) => setScore(Number(event.target.value))}
            className="w-24 rounded-button border border-border-strong px-3 py-2 text-right text-sm data-figure"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-primary">Kanıtlar</h2>
        {draft.evidence.map((item, index) => (
          <EvidenceFields
            key={index}
            index={index}
            value={item}
            onChange={(next) => setEvidence(index, next)}
            onRemove={() => update({ evidence: draft.evidence.filter((_, i) => i !== index) })}
            canRemove={draft.evidence.length > 1}
          />
        ))}
        <button
          type="button"
          onClick={() => update({ evidence: [...draft.evidence, { ...EMPTY_EVIDENCE }] })}
          className="text-sm font-semibold text-accent hover:text-accent-hover"
        >
          + Kanıt ekle
        </button>
      </section>

      <section className="grid gap-4 rounded-card border border-border bg-surface-card p-5 sm:grid-cols-2">
        <div>
          <label htmlFor="note" className="mb-1 block text-xs font-semibold text-ink-secondary">
            İç not (yalnız admin görür)
          </label>
          <textarea id="note" rows={3} value={draft.note} onChange={(event) => update({ note: event.target.value })} className={TEXT_CLASS} />
        </div>
        <div>
          <label htmlFor="publicNote" className="mb-1 block text-xs font-semibold text-ink-secondary">
            Kamuya açık açıklama (değişiklik günlüğünde görünür)
          </label>
          <textarea
            id="publicNote"
            rows={3}
            value={draft.publicNote}
            onChange={(event) => update({ publicNote: event.target.value })}
            className={TEXT_CLASS}
          />
          <label className="mt-2 flex items-center gap-2 text-xs text-ink-secondary">
            <input type="checkbox" checked={draft.isPublic} onChange={(event) => update({ isPublic: event.target.checked })} />
            Bu değişikliği herkese açık değişiklik günlüğünde göster
          </label>
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-4 text-sm">
        <h2 className="mb-2 font-semibold text-ink-primary">Yayın önizlemesi</h2>
        {!diff.hasChanges ? (
          <p className="text-ink-secondary">Değişiklik yok. Konum hâlâ geçerliyse &quot;Doğrulandı&quot; deyin.</p>
        ) : (
          <ul className="space-y-1 text-ink-secondary">
            {diff.scoreChanged && (
              <li>
                Puan: <span className="data-figure">{initialScore ?? '—'}</span> →{' '}
                <span className="data-figure font-semibold text-ink-primary">{draft.score}</span>
                {diff.delta !== null && <span className="data-figure"> ({diff.delta > 0 ? '+' : ''}{diff.delta})</span>}
              </li>
            )}
            {diff.evidenceAdded.length > 0 && <li>{diff.evidenceAdded.length} kanıt eklenecek / değişecek</li>}
            {diff.evidenceRemoved.length > 0 && <li>{diff.evidenceRemoved.length} kanıt kaldırılacak / değişecek</li>}
          </ul>
        )}
      </section>

      {message && (
        <p
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={`rounded-card border-l-4 p-3 text-sm ${
            message.kind === 'error' ? 'border-ink-primary bg-surface-muted text-ink-primary' : 'border-accent bg-accent-tint text-ink-primary'
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={publish} disabled={busy !== null || !diff.hasChanges}>
          {busy === 'publish' ? 'Yayınlanıyor…' : 'Yayınla'}
        </Button>
        {positionId && (
          <Button type="button" variant="secondary" onClick={verify} disabled={busy !== null || diff.hasChanges}>
            {busy === 'verify' ? 'Kaydediliyor…' : 'Doğrulandı, değişiklik yok'}
          </Button>
        )}
      </div>
    </div>
  )
}
