'use client'

interface ImageChoiceOption {
  id: string
  text: string
  value: string
  imageUrl?: string
}

interface ImageChoiceQuestionProps {
  options: ImageChoiceOption[]
  multi?: boolean
  value: string[]
  onChange: (value: string[]) => void
}

export function ImageChoiceQuestion({ options, multi = false, value, onChange }: ImageChoiceQuestionProps) {
  const toggle = (optionValue: string) => {
    if (multi) {
      const next = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue]
      onChange(next)
    } else {
      onChange([optionValue])
    }
  }

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {options.map((option) => {
        const selected = value.includes(option.value)
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => toggle(option.value)}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
              selected ? 'border-rainbow-blue bg-surface-muted' : 'border-border hover:border-border-strong'
            }`}
          >
            {option.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={option.imageUrl} alt={option.text} className="h-20 w-20 rounded-md object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-md bg-surface-muted text-xs text-ink-secondary">
                Görsel yok
              </div>
            )}
            <span className="text-center text-sm text-ink-primary">{option.text}</span>
          </button>
        )
      })}
    </div>
  )
}
