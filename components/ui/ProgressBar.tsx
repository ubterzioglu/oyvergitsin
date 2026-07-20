interface ProgressBarProps {
  progress: number
  label?: string
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full bg-rainbow-blue transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {label ? (
        <p className="mt-2 text-center text-sm text-ink-secondary">{label}</p>
      ) : null}
    </div>
  )
}
