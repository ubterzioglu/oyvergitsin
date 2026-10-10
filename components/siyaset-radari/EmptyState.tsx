import type { ReactNode } from 'react'

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-white px-6 py-12 text-center text-sm text-ink-secondary">
      {children}
    </div>
  )
}
