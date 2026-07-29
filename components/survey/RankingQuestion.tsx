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

const RANK_ACCENTS = ['#F5C518', '#F5821F', '#E8385C', '#7B4FE0', '#1E9BE0', '#3CB043']

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
    'disabled:pointer-events-none disabled:text-ink-muted disabled:opacity-35'

  return (
    <ul className="mb-8 space-y-2">
      {orderedValues.map((optionValue, index) => {
        const option = optionsByValue.get(optionValue)
        if (!option) return null

        const accent = RANK_ACCENTS[index % RANK_ACCENTS.length]

        return (
          <li
            key={option.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface-card p-3 shadow-soft transition-all hover:border-border-strong hover:shadow-elevated sm:p-4"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-soft"
              style={{ backgroundColor: accent }}
            >
              {index + 1}
            </span>
            <span className="flex-1 text-sm text-ink-primary sm:text-base">{option.text}</span>
            <div className="flex shrink-0 flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface-card shadow-soft">
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
