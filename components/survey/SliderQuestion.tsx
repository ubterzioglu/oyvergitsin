'use client'

interface SliderQuestionProps {
  value: number
  min?: number
  max?: number
  minLabel?: string
  maxLabel?: string
  onChange: (value: number) => void
}

export function SliderQuestion({
  value,
  min = 0,
  max = 100,
  minLabel,
  maxLabel,
  onChange,
}: SliderQuestionProps) {
  return (
    <div className="mb-8">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-rainbow-blue"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
      <div className="mt-2 flex justify-between text-xs text-ink-secondary">
        <span>{minLabel ?? min}</span>
        <span className="text-sm font-semibold text-ink-primary">{value}</span>
        <span>{maxLabel ?? max}</span>
      </div>
    </div>
  )
}
