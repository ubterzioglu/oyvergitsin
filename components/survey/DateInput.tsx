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
        className="w-full rounded-lg border-2 border-border p-4 text-ink-primary focus:border-rainbow-blue focus:outline-none"
      />
    </div>
  )
}
