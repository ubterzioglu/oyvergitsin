'use client'

interface CaptchaPlaceholderProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function CaptchaPlaceholder({ checked, onChange }: CaptchaPlaceholderProps) {
  return (
    <div className="mb-8">
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-border p-6 hover:border-border-strong">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-5 w-5 accent-rainbow-blue"
        />
        <span className="text-ink-primary">İnsan olduğumu onaylıyorum</span>
      </label>
    </div>
  )
}
