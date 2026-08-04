'use client'

interface NoOpinionButtonProps {
  text: string
  selected: boolean
  onSelect: () => void
}

/**
 * Eski ayrı "Fikrim yok" kontrolü. Aktif Likert akışı artık bu seçeneği
 * LikertScale içinde aynı boyutta son seçenek olarak gösterir.
 *
 * Metodoloji raporu §1-03: "nötr" ile "fikrim yok" aynı seçenek olmamalıdır.
 * Kararsızım ölçek üzerinde gerçek bir 0 puandır; fikrim yok ise puanlamadan
 * tamamen dışlanır. İkisi görsel olarak da ayrışmalı ki kullanıcı yanlışlıkla
 * birini diğerinin yerine seçmesin.
 */
export function NoOpinionButton({ text, selected, onSelect }: NoOpinionButtonProps) {
  return (
    <div className="mb-4 -mt-1 flex justify-center sm:mb-6 sm:-mt-2">
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors sm:px-4 sm:py-2 ${
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
