'use client'

interface DateInputProps {
  value: string
  onChange: (value: string) => void
}

export function DateInput({ value, onChange }: DateInputProps) {
  return (
    <div className="mb-8">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="data-figure w-full rounded-button border-2 border-border bg-surface-card p-4 text-ink-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  )
}
