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
          className="w-full rounded-lg border-2 border-border p-4 text-ink-primary focus:border-rainbow-blue focus:outline-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border-2 border-border p-4 text-ink-primary focus:border-rainbow-blue focus:outline-none"
        />
      )}
      <p className="mt-1 text-right text-xs text-ink-secondary">
        {value.length} / {maxLength}
      </p>
    </div>
  )
}
