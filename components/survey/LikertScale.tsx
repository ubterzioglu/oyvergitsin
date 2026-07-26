'use client'

interface LikertOption {
  id: string
  text: string
  value: string
}

interface LikertScaleProps {
  options: LikertOption[]
  value: string
  onChange: (value: string) => void
}

export function LikertScale({ options, value, onChange }: LikertScaleProps) {
  return (
    <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:justify-between sm:gap-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-3 text-center transition-all ${
            value === option.value
              ? 'border-rainbow-blue bg-surface-muted'
              : 'border-border hover:border-border-strong'
          }`}
        >
          <span
            className={`h-4 w-4 rounded-full border-2 ${
              value === option.value ? 'border-rainbow-blue bg-rainbow-blue' : 'border-border-strong'
            }`}
          />
          <span className="text-xs text-ink-secondary">{option.text}</span>
        </button>
      ))}
    </div>
  )
}
