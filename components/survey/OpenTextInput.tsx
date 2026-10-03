'use client'

interface OpenTextInputProps {
  value: string
  long?: boolean
  maxLength?: number
  onChange: (value: string) => void
}

export function OpenTextInput({ value, long = false, maxLength = 500, onChange }: OpenTextInputProps) {
  return (
    <div className="mb-8">
      {long ? (
        <textarea
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className="w-full rounded-button border-2 border-border bg-surface-card p-4 text-ink-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
        />
      ) : (
        <input
          type="text"
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-button border-2 border-border bg-surface-card p-4 text-ink-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
        />
      )}
      <p className="data-figure mt-1 text-right text-xs text-ink-secondary">
        {value.length} / {maxLength}
      </p>
    </div>
  )
}
