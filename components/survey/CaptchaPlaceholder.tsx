'use client'

interface CaptchaPlaceholderProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function CaptchaPlaceholder({ checked, onChange }: CaptchaPlaceholderProps) {
  return (
    <div className="mb-8">
      <label className="flex cursor-pointer items-center gap-3 rounded-button border-2 border-border bg-surface-card p-6 transition-colors hover:border-border-strong">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-5 w-5 accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        />
        <span className="text-ink-primary">İnsan olduğumu onaylıyorum</span>
      </label>
    </div>
  )
}
