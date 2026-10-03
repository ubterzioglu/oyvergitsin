'use client'

interface LikertOption {
  id: string
  text: string
  value: string
}

interface LikertScaleProps {
  options: LikertOption[]
  value: string
  onChange: (value: string) => void
}

const NO_OPINION_VALUE = 'no_opinion'

/**
 * B14 — "Kamusal Ekran": eski rainbow tonları (kırmızı=katılmıyorum,
 * yeşil=katılıyorum, mor=fikrim yok) kalktı; basamaklar scale-* rampasının
 * dolgu tonlarıyla ayrışıyor. Çipler metin TAŞIMAZ (dolgu üzerindeki tek
 * öğe grafiksel onay işareti): scale-4 küçük metinde AA'yı geçmiyor
 * (ink 4.23 / beyaz 4.05), bu yüzden rampanın hiçbir adımına yazı konmadı.
 *
 * Rampa komşu adımları birbirine yakın (kontrast 1.32–1.39), yani renk TEK
 * ayırt edici değil ve olamaz: her basamağın metin etiketi ve listedeki
 * konumu birincil ayırt edici; dolgu tonu yalnızca sırayı pekiştirir.
 * Seçili durum renkten bağımsız da okunur: accent kenarlık + accent-tint
 * zemin + kalın etiket + çipin içindeki onay işareti + aria-pressed.
 *
 * 5 basamaklı canlı ölçek rampanın en koyu beşlisini kullanır (scale-2..6;
 * scale-1 beyaz kartın yanında 1.55 kontrastla fazla soluk kalıyordu).
 * 6+ basamaklı ölçeklerde (likert_7) rampa baştan sona oranlı taranır.
 */
const STEP_FILLS = ['bg-scale-1', 'bg-scale-2', 'bg-scale-3', 'bg-scale-4', 'bg-scale-5', 'bg-scale-6']

// Onay işareti grafiksel öğe (WCAG 1.4.11 eşiği 3:1): scale-1..4 üzerine ink
// (11.06 / 7.98 / 5.80 / 4.23), scale-5..6 üzerine beyaz (5.37 / 7.06).
const STEP_CHECKS = [
  'text-ink-primary',
  'text-ink-primary',
  'text-ink-primary',
  'text-ink-primary',
  'text-white',
  'text-white',
]

function fillIndexFor(stepIndex: number, stepCount: number) {
  if (stepCount <= 1) return 5
  const start = stepCount <= 5 ? 6 - stepCount : 0
  return start + Math.round((stepIndex / (stepCount - 1)) * (5 - start))
}

function CheckMark({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3.5 w-3.5 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 6.5L4.5 9L10 3" />
    </svg>
  )
}

export function LikertScale({ options, value, onChange }: LikertScaleProps) {
  const scaleOptions = options.filter((option) => option.value !== NO_OPINION_VALUE)
  const stepCount = scaleOptions.length

  return (
    <div className="mb-4 flex flex-col gap-2 sm:mb-6">
      {options.map((option, index) => {
        const isNoOpinion = option.value === NO_OPINION_VALUE
        const selected = value === option.value
        // "Fikrim yok" rampanın parçası değil (metodoloji §1-03: nötr ile
        // karıştırılmamalı) — ölçek çipi yerine kesikli kenarlıklı boş çip
        // taşır ve gruptan boşlukla ayrılır.
        const fillIndex = isNoOpinion ? -1 : fillIndexFor(index, stepCount)

        const rowBase =
          'group flex w-full items-center gap-3 rounded-button border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:px-4 sm:py-3'
        const rowState = selected
          ? 'border-accent bg-accent-tint'
          : isNoOpinion
            ? 'border-dashed border-border-strong bg-surface-card hover:border-ink-muted hover:shadow-soft'
            : 'border-border bg-surface-card hover:border-border-strong hover:shadow-soft'

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`${rowBase} ${rowState} ${isNoOpinion ? 'mt-1.5 sm:mt-2' : ''}`}
          >
            {isNoOpinion ? (
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-badge border-2 border-dashed transition-colors ${
                  selected ? 'border-accent bg-surface-card' : 'border-ink-muted bg-surface-card'
                }`}
              >
                {selected && <CheckMark className="text-accent" />}
              </span>
            ) : (
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-badge ${STEP_FILLS[fillIndex]}`}
              >
                {selected && <CheckMark className={STEP_CHECKS[fillIndex]} />}
              </span>
            )}
            <span
              className={`text-xs leading-tight sm:text-sm ${
                selected ? 'font-semibold text-ink-primary' : 'text-ink-secondary'
              }`}
            >
              {option.text}
            </span>
          </button>
        )
      })}
    </div>
  )
}
