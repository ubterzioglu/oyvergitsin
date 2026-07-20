import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

export function Card({ elevated = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-card bg-surface-card p-8 ${elevated ? 'shadow-elevated' : 'shadow-soft'} ${className}`}
      {...props}
    />
  )
}
