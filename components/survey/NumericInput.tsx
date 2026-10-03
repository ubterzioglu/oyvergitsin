'use client'

interface NumericInputProps {
  value: string
  min?: number
  max?: number
  onChange: (value: string) => void
}

export function NumericInput({ value, min = 0, max = 100, onChange }: NumericInputProps) {
  return (
    <div className="mb-8">
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="data-figure w-full rounded-button border-2 border-border bg-surface-card p-4 text-ink-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
        placeholder={`${min} - ${max}`}
      />
    </div>
  )
}
