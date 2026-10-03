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
 *
 * B14 — "Kamusal Ekran": eski turuncu (rainbow-orange) vurgu kalktı; tek
 * accent petrol. Seçili durum accent-tint zemin + accent kenarlık + dolu
 * onay kutusu; işaretsiz durum boş kutu. Durum yalnız renkle taşınmıyor:
 * kutunun dolu/boş olması ve etiketin kalınlaşması ikinci ayırt edici.
 * Alt açıklama metni ink-secondary (ink-muted/accent-tint 4.09 ile AA altı
 * kalıyordu; ink-secondary tint üzerinde 5.46, kart üzerinde 6.38).
 */
export function ImportanceToggle({ checked, onChange }: ImportanceToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`mt-2 flex w-full items-center gap-2.5 rounded-button border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:mt-4 sm:gap-3 sm:px-4 sm:py-3 ${
        checked
          ? 'border-accent bg-accent-tint'
          : 'border-border bg-surface-card hover:border-border-strong hover:shadow-soft'
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-badge border-2 transition-colors ${
          checked ? 'border-accent bg-accent' : 'border-ink-muted bg-surface-card'
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
      <span className="text-xs sm:text-sm">
        <span className={checked ? 'font-semibold text-ink-primary' : 'text-ink-secondary'}>
          Bu konu benim için önemli
        </span>
        <span className="block text-[11px] leading-snug text-ink-secondary sm:text-xs">
          İşaretlerseniz bu konu eşleşmenizde daha ağır tartılır.
        </span>
      </span>
    </button>
  )
}
