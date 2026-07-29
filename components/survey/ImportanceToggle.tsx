'use client'

interface ImportanceToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

/**
 * Kullanıcı bir konuyu "benim için önemli" işaretlerse, o maddenin ekseni parti
 * uzaklığı hesabında 1 yerine 1,5 ağırlıkla girer (metodoloji raporu §5.2).
 *
 * Rapor iki kat ağırlığı fazla buluyor: sonuçları gereğinden çok oynatıyor.
 */
export function ImportanceToggle({ checked, onChange }: ImportanceToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`mt-4 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
        checked
          ? 'border-rainbow-orange bg-rainbow-orange-tint'
          : 'border-border hover:border-border-strong'
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          checked ? 'border-rainbow-orange bg-rainbow-orange' : 'border-border-strong'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" aria-hidden="true">
            <path
              d="M2 6.5L4.5 9L10 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="text-sm">
        <span className={checked ? 'font-semibold text-ink-primary' : 'text-ink-secondary'}>
          Bu konu benim için önemli
        </span>
        <span className="block text-xs text-ink-muted">
          İşaretlerseniz bu konu eşleşmenizde daha ağır tartılır.
        </span>
      </span>
    </button>
  )
}
