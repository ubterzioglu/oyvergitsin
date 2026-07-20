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

  return (
    <ul className="mb-8 space-y-2">
      {orderedValues.map((optionValue, index) => {
        const option = optionsByValue.get(optionValue)
        if (!option) return null

        return (
          <li
            key={option.id}
            className="flex items-center gap-3 rounded-lg border-2 border-border p-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold text-ink-primary">
              {index + 1}
            </span>
            <span className="flex-1 text-ink-primary">{option.text}</span>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                aria-label="Yukarı taşı"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="rounded-lg border border-border px-2 py-1 text-ink-secondary hover:border-border-strong disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label="Aşağı taşı"
                onClick={() => move(index, 1)}
                disabled={index === orderedValues.length - 1}
                className="rounded-lg border border-border px-2 py-1 text-ink-secondary hover:border-border-strong disabled:opacity-30"
              >
                ↓
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
