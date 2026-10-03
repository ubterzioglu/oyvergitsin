import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

// Etkileşim rengi petrol accent (B9 "Kamusal Ekran" kararı); gölge kaldırıldı —
// yön gölgeyi yalnızca hover'a indiriyor, butonlar düz token'larla ayrışıyor.
// hover:enabled: kullanımı, devre dışı butonun üzerine gelince hover renginin
// parlamasını engelliyor.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white hover:enabled:bg-accent-hover',
  secondary:
    'bg-surface-muted text-ink-primary hover:enabled:bg-border',
  ghost:
    'bg-transparent text-ink-secondary hover:enabled:text-ink-primary',
}

// Devre dışı durum opaklıkla değil token'la ifade edilir: opacity-50 tüm
// çiftlerin kontrastını yarıya indiriyordu (beyaz/accent 5.92 -> ~2.6, AA altı).
// ink-secondary/surface-muted = 5.63 ile disabled durumu da AA kalır.
const DISABLED_CLASSES =
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-secondary disabled:shadow-none'

// Görünür odak halkası: accent, sayfa zeminine karşı 5.57 (UI bileşen eşiği
// 3:1'in üstünde). focus-visible ile yalnızca klavye gezinmesinde görünür.
const FOCUS_CLASSES =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-button px-8 py-3 font-semibold transition-all ${FOCUS_CLASSES} ${DISABLED_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  )
}
