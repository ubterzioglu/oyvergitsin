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
        className="w-full rounded-lg border-2 border-border p-4 text-ink-primary focus:border-rainbow-blue focus:outline-none"
        placeholder={`${min} - ${max}`}
      />
    </div>
  )
}
