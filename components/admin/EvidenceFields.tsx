'use client'

import { EVIDENCE_SOURCE_LABELS, EVIDENCE_SOURCE_TYPES } from '@/lib/validation/content-admin'

export interface EvidenceDraft {
  source_type: string
  source_title: string
  source_url: string
  source_date: string
  quote: string
  rationale: string
}

export const EMPTY_EVIDENCE: EvidenceDraft = {
  source_type: 'parti_programi',
  source_title: '',
  source_url: '',
  source_date: '',
  quote: '',
  rationale: '',
}

interface Props {
  index: number
  value: EvidenceDraft
  onChange: (next: EvidenceDraft) => void
  onRemove: () => void
  canRemove: boolean
}

const INPUT_CLASS =
  'w-full rounded-button border border-border-strong bg-white px-3 py-2 text-sm text-ink-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30'
const LABEL_CLASS = 'mb-1 block text-xs font-semibold text-ink-secondary'

export function EvidenceFields({ index, value, onChange, onRemove, canRemove }: Props) {
  const set = (field: keyof EvidenceDraft) => (event: { target: { value: string } }) =>
    onChange({ ...value, [field]: event.target.value })
  const id = (field: string) => `evidence-${index}-${field}`

  return (
    <fieldset className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <legend className="text-sm font-semibold text-ink-primary">Kanıt {index + 1}</legend>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs font-semibold text-ink-secondary hover:text-ink-primary">
            Kaldır
          </button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={id('type')} className={LABEL_CLASS}>Kaynak türü</label>
          <select id={id('type')} value={value.source_type} onChange={set('source_type')} className={INPUT_CLASS}>
            {EVIDENCE_SOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {EVIDENCE_SOURCE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id('date')} className={LABEL_CLASS}>Kaynak tarihi</label>
          <input id={id('date')} type="date" value={value.source_date} onChange={set('source_date')} className={INPUT_CLASS} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={id('title')} className={LABEL_CLASS}>Kaynak başlığı *</label>
          <input id={id('title')} value={value.source_title} onChange={set('source_title')} className={INPUT_CLASS} required />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={id('url')} className={LABEL_CLASS}>Bağlantı (https)</label>
          <input id={id('url')} type="url" value={value.source_url} onChange={set('source_url')} className={INPUT_CLASS} placeholder="https://" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={id('quote')} className={LABEL_CLASS}>Alıntı (isteğe bağlı)</label>
          <textarea id={id('quote')} value={value.quote} onChange={set('quote')} rows={2} className={INPUT_CLASS} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={id('rationale')} className={LABEL_CLASS}>Gerekçe * (en az 20 karakter)</label>
          <textarea id={id('rationale')} value={value.rationale} onChange={set('rationale')} rows={3} className={INPUT_CLASS} required />
        </div>
      </div>
    </fieldset>
  )
}
