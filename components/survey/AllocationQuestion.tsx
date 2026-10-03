'use client'

interface AllocationItem {
  id: string
  text: string
  value: string
}

interface AllocationQuestionProps {
  items: AllocationItem[]
  total?: number
  value: Record<string, number>
  onChange: (value: Record<string, number>) => void
}

export function AllocationQuestion({ items, total = 100, value, onChange }: AllocationQuestionProps) {
  const spent = Object.values(value).reduce((sum, n) => sum + (n || 0), 0)
  const remaining = total - spent

  const setItemValue = (itemValue: string, amount: number) => {
    const clamped = Math.max(0, Math.min(total, amount))
    onChange({ ...value, [itemValue]: clamped })
  }

  return (
    <div className="mb-8 space-y-3">
      {/* Aşım durumu renkle değil vurguyla bildirilir (kabukta tek accent
          var, kırmızı dolgu parti rengiyle çakışma riski demek); negatif
          sayının kendisi de ink-primary'ye koyulaşıyor. Sayılar mono. */}
      <p className={`text-sm ${remaining < 0 ? 'font-semibold text-ink-primary' : 'font-medium text-ink-secondary'}`}>
        Kalan puan:{' '}
        <span className="data-figure">
          {remaining} / {total}
        </span>
      </p>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-button border-2 border-border bg-surface-card p-4 transition-colors hover:border-border-strong"
        >
          <span className="flex-1 text-ink-primary">{item.text}</span>
          <input
            type="number"
            min={0}
            max={total}
            value={value[item.value] ?? 0}
            onChange={(e) => setItemValue(item.value, Number(e.target.value))}
            className="data-figure w-20 rounded-button border border-border-strong bg-surface-card p-2 text-right text-ink-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      ))}
    </div>
  )
}
