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
      <p className={`text-sm font-medium ${remaining < 0 ? 'text-red-600' : 'text-ink-secondary'}`}>
        Kalan puan: {remaining} / {total}
      </p>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 rounded-lg border-2 border-border p-4">
          <span className="flex-1 text-ink-primary">{item.text}</span>
          <input
            type="number"
            min={0}
            max={total}
            value={value[item.value] ?? 0}
            onChange={(e) => setItemValue(item.value, Number(e.target.value))}
            className="w-20 rounded-lg border border-border p-2 text-right text-ink-primary focus:border-rainbow-blue focus:outline-none"
          />
        </div>
      ))}
    </div>
  )
}
