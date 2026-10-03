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
        className="w-full accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
      <div className="mt-2 flex justify-between text-xs text-ink-secondary">
        <span className="data-figure">{minLabel ?? min}</span>
        <span className="data-figure text-sm font-semibold text-ink-primary">{value}</span>
        <span className="data-figure">{maxLabel ?? max}</span>
      </div>
    </div>
  )
}
