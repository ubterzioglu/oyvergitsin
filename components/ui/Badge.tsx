import type { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: string
}

export function Badge({ color, className = '', style, children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-badge border border-border-strong bg-surface-muted px-3 py-1 text-sm font-medium text-ink-secondary ${className}`}
      style={color ? { borderColor: color, color, ...style } : style}
      {...props}
    >
      {children}
    </span>
  )
}
