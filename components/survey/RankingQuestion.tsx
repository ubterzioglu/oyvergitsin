'use client'

interface RankingOption {
  id: string
  text: string
  value: string
}

interface RankingQuestionProps {
  options: RankingOption[]
  order: string[]
  onChange: (order: string[]) => void
}

// B14: hardcoded hex dizisi (RANK_ACCENTS) kalktı — inline style token
// katmanını bypass ediyordu. Sıra rozetleri sıralı (ordinal) bilgi taşır,
// bu yüzden scale-* rampası kavramsal olarak da doğru: açıktan koyuya gidiyor.
// Rozet NUMARA TAŞIR, bu yüzden adım seçiminde küçük-metin AA'sı gözetildi:
//   scale-1 ink 11.06 · scale-2 ink 7.98 · scale-3 ink 5.80
//   scale-4 ATLANDI (ink 4.23 / beyaz 4.05 — ikisi de 4.5 altı)
//   scale-5 beyaz 5.37 · scale-6 beyaz 7.06
// Komşu rozetler arası renk kontrastı ~1.35: sıra numarası metni (mono) ve
// listedeki konum birincil ayırt edici, renk yalnızca pekiştirici.
const RANK_STEPS = [
  { fill: 'bg-scale-1', text: 'text-ink-primary' },
  { fill: 'bg-scale-2', text: 'text-ink-primary' },
  { fill: 'bg-scale-3', text: 'text-ink-primary' },
  { fill: 'bg-scale-5', text: 'text-white' },
  { fill: 'bg-scale-6', text: 'text-white' },
]

function rankStep(index: number) {
  return RANK_STEPS[Math.min(index, RANK_STEPS.length - 1)]
}

function Chevron({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`h-3.5 w-3.5 ${direction === 'down' ? 'rotate-180' : ''}`}
    >
      <path d="M4 10 8 6l4 4" />
    </svg>
  )
}

export function RankingQuestion({ options, order, onChange }: RankingQuestionProps) {
  const optionsByValue = new Map(options.map((option) => [option.value, option]))
  const orderedValues = order.length > 0 ? order : options.map((option) => option.value)

  const move = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= orderedValues.length) return

    const next = [...orderedValues]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    onChange(next)
  }

  const moveButtonClass =
    'flex h-7 w-9 items-center justify-center text-ink-secondary transition-colors ' +
    'hover:bg-surface-muted hover:text-ink-primary active:bg-border ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ' +
    'disabled:pointer-events-none disabled:text-border-strong'

  return (
    <ul className="mb-8 space-y-2">
      {orderedValues.map((optionValue, index) => {
        const option = optionsByValue.get(optionValue)
        if (!option) return null

        const step = rankStep(index)

        return (
          <li
            key={option.id}
            className="flex items-center gap-3 rounded-card border border-border bg-surface-card p-3 transition-all hover:border-border-strong hover:shadow-soft sm:p-4"
          >
            <span
              className={`data-figure flex h-8 w-8 shrink-0 items-center justify-center rounded-badge text-sm font-semibold ${step.fill} ${step.text}`}
            >
              {index + 1}
            </span>
            <span className="flex-1 text-sm text-ink-primary sm:text-base">{option.text}</span>
            <div className="flex shrink-0 flex-col divide-y divide-border overflow-hidden rounded-button border border-border bg-surface-card">
              <button
                type="button"
                aria-label={`${option.text} sıralamasını yukarı taşı`}
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className={moveButtonClass}
              >
                <Chevron direction="up" />
              </button>
              <button
                type="button"
                aria-label={`${option.text} sıralamasını aşağı taşı`}
                onClick={() => move(index, 1)}
                disabled={index === orderedValues.length - 1}
                className={moveButtonClass}
              >
                <Chevron direction="down" />
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
