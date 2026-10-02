import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

// "Kamusal Ekran" yönünde kartlar gölgeyle değil 1px kenarlıkla ayrışır;
// gölge yalnızca hover için saklanır (sayfa batch'leri hover:shadow-* ekler).
// elevated prop'u API uyumluluğu için korunuyor: kaldırılan gölgenin yerine
// daha güçlü bir kenarlık + istenirse elevated gölge verir.
export function Card({ elevated = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-card border border-border bg-surface-card p-8 ${elevated ? 'border-border-strong shadow-elevated' : ''} ${className}`}
      {...props}
    />
  )
}
