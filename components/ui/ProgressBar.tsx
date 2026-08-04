interface ProgressBarProps {
  progress: number
  label?: string
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted sm:h-2">
        <div
          className="h-full bg-rainbow-blue transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {label ? (
        <p className="mt-1.5 text-center text-xs text-ink-secondary sm:mt-2 sm:text-sm">{label}</p>
      ) : null}
    </div>
  )
}
