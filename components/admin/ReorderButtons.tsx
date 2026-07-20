'use client'

interface ReorderButtonsProps {
  onMoveUp: () => void
  onMoveDown: () => void
  disableUp?: boolean
  disableDown?: boolean
}

export function ReorderButtons({ onMoveUp, onMoveDown, disableUp, disableDown }: ReorderButtonsProps) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={disableUp}
        aria-label="Yukarı taşı"
        className="px-1 text-ink-secondary hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-30"
      >
        ▲
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={disableDown}
        aria-label="Aşağı taşı"
        className="px-1 text-ink-secondary hover:text-ink-primary disabled:cursor-not-allowed disabled:opacity-30"
      >
        ▼
      </button>
    </div>
  )
}
