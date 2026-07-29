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
  // 7 noktalı ölçekte kutular dar kaldığı için boşluklar sıkılaştırılır.
  const dense = options.length > 5

  return (
    // min-w-0: flex item'ların varsayılan min-width:auto değeri, uzun etiketli
    // şıkların kısa olanlardan geniş kalmasına yol açıyordu. Sıfırlanınca
    // basis-0 devreye girer ve tüm kutular eşit genişlikte olur.
    <div
      className={`mb-6 flex flex-col gap-2 sm:flex-row sm:items-stretch ${
        dense ? 'sm:gap-1.5' : 'sm:gap-2'
      }`}
    >
      {options.map((option) => {
        const selected = value === option.value

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`group flex min-w-0 flex-1 items-center gap-3 rounded-xl border p-3 text-left transition-all sm:flex-col sm:justify-start sm:gap-2 sm:text-center ${
              dense ? 'sm:p-2' : 'sm:p-3'
            } ${
              selected
                ? 'border-rainbow-blue bg-rainbow-blue-tint shadow-soft'
                : 'border-border bg-surface-card hover:border-border-strong hover:shadow-soft'
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                selected
                  ? 'border-rainbow-blue bg-rainbow-blue'
                  : 'border-border-strong group-hover:border-ink-muted'
              }`}
            >
              {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
            <span
              className={`text-xs leading-tight ${
                selected ? 'font-semibold text-ink-primary' : 'text-ink-secondary'
              }`}
            >
              {option.text}
            </span>
          </button>
        )
      })}
    </div>
  )
}
