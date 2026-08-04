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
  const toneFor = (optionValue: string) => {
    if (optionValue === 'no_opinion') {
      return {
        option: 'border-rainbow-purple/35 hover:border-rainbow-purple/70',
        selectedOption: 'border-rainbow-purple shadow-soft',
        control: 'border-rainbow-purple/50 group-hover:border-rainbow-purple',
        selectedControl: 'border-rainbow-purple',
        dot: 'bg-rainbow-purple',
      }
    }
    if (optionValue.includes('disagree')) {
      return {
        option: 'border-rainbow-red/35 hover:border-rainbow-red/70',
        selectedOption: 'border-rainbow-red shadow-soft',
        control: 'border-rainbow-red/50 group-hover:border-rainbow-red',
        selectedControl: 'border-rainbow-red',
        dot: 'bg-rainbow-red',
      }
    }
    if (optionValue.includes('agree')) {
      return {
        option: 'border-rainbow-green/35 hover:border-rainbow-green/70',
        selectedOption: 'border-rainbow-green shadow-soft',
        control: 'border-rainbow-green/50 group-hover:border-rainbow-green',
        selectedControl: 'border-rainbow-green',
        dot: 'bg-rainbow-green',
      }
    }
    return {
      option: 'border-border hover:border-border-strong',
      selectedOption: 'border-ink-muted shadow-soft',
      control: 'border-border-strong group-hover:border-ink-muted',
      selectedControl: 'border-ink-muted',
      dot: 'bg-ink-muted',
    }
  }

  return (
    <div className="mb-4 flex flex-col gap-2 sm:mb-6">
      {options.map((option) => {
        const selected = value === option.value
        const tone = toneFor(option.value)

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`group flex w-full items-center gap-2.5 rounded-lg border bg-surface-card px-3 py-2.5 text-left transition-all hover:shadow-soft sm:gap-3 sm:px-4 sm:py-3 ${
              selected ? tone.selectedOption : tone.option
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                selected ? tone.selectedControl : tone.control
              }`}
            >
              {selected && <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />}
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
