'use client'

import { LikertScale } from './LikertScale'

interface VignetteOption {
  id: string
  text: string
  value: string
}

interface VignetteLikertProps {
  vignetteText: string
  options: VignetteOption[]
  value: string
  onChange: (value: string) => void
}

export function VignetteLikert({ vignetteText, options, value, onChange }: VignetteLikertProps) {
  return (
    <div className="mb-2">
      <div className="mb-5 rounded-lg bg-surface-muted p-4 text-sm italic text-ink-secondary">
        {vignetteText}
      </div>
      <LikertScale options={options} value={value} onChange={onChange} />
    </div>
  )
}
