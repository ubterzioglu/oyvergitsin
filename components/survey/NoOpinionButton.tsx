'use client'

interface NoOpinionButtonProps {
  text: string
  selected: boolean
  onSelect: () => void
}

/**
 * "Fikrim yok" seçeneği ölçeğin İÇİNE bir kutu olarak konmaz.
 *
 * Metodoloji raporu §1-03: "nötr" ile "fikrim yok" aynı seçenek olmamalıdır.
 * Kararsızım ölçek üzerinde gerçek bir 0 puandır; fikrim yok ise puanlamadan
 * tamamen dışlanır. İkisi görsel olarak da ayrışmalı ki kullanıcı yanlışlıkla
 * birini diğerinin yerine seçmesin.
 */
export function NoOpinionButton({ text, selected, onSelect }: NoOpinionButtonProps) {
  return (
    <div className="mb-6 -mt-2 flex justify-center">
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={`rounded-full border px-4 py-2 text-xs transition-colors ${
          selected
            ? 'border-ink-muted bg-surface-muted font-semibold text-ink-primary'
            : 'border-border text-ink-secondary hover:border-border-strong hover:text-ink-primary'
        }`}
      >
        {text}
      </button>
    </div>
  )
}
