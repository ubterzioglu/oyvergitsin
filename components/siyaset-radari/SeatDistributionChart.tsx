import { assignPartyColors, toPartyShortName } from '@/components/siyaset-radari/party-colors'

export interface SeatRow {
  name: string
  value: number
  stale: boolean
}

interface Props {
  rows: SeatRow[]
}

const TBMM_TOTAL_SEATS = 600

function formatShare(value: number, total: number): string {
  return `%${((value / total) * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`
}

/**
 * TBMM sandalye dağılımı. Pasta grafik 16 partide okunmaz hale geliyordu
 * (etiketler dilimlerin üstüne biniyordu); bunun yerine tek parça meclis
 * şeridi + büyük sayılı sıralı liste kullanılır. Renkler gerçek parti renkleri.
 */
export function SeatDistributionChart({ rows }: Props) {
  const sorted = [...rows].sort((a, b) => b.value - a.value)
  const colors = assignPartyColors(sorted.map((row) => row.name))
  const filled = sorted.reduce((sum, row) => sum + row.value, 0)
  const vacant = Math.max(TBMM_TOTAL_SEATS - filled, 0)
  const max = sorted[0]?.value ?? 1
  const hasStale = sorted.some((row) => row.stale)

  return (
    <div className="mt-4">
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-4xl font-bold tabular-nums text-ink-primary">{filled}</span>
        <span className="text-sm text-ink-secondary">/ {TBMM_TOTAL_SEATS} sandalye dolu</span>
      </div>

      <div
        className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-surface-muted"
        role="img"
        aria-label={`TBMM sandalye dağılımı: ${sorted.map((row) => `${toPartyShortName(row.name)} ${row.value}`).join(', ')}`}
      >
        {sorted.map((row, index) => (
          <div
            key={row.name}
            className="h-full border-r border-white last:border-r-0"
            style={{ width: `${(row.value / TBMM_TOTAL_SEATS) * 100}%`, backgroundColor: colors[index] }}
            title={`${row.name}: ${row.value}`}
          />
        ))}
      </div>
      {vacant > 0 && <p className="mt-1.5 text-xs text-ink-muted">{vacant} sandalye boş</p>}

      <ol className="mt-5 space-y-3">
        {sorted.map((row, index) => (
          <li key={row.name}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index] }} aria-hidden="true" />
                <span className="truncate text-sm font-medium text-ink-primary" title={row.name}>
                  {toPartyShortName(row.name)}
                </span>
              </span>
              <span className="flex shrink-0 items-baseline gap-2">
                <span className="text-xl font-bold tabular-nums text-ink-primary">{row.value}</span>
                <span className="w-12 text-right text-xs tabular-nums text-ink-muted">
                  {formatShare(row.value, TBMM_TOTAL_SEATS)}
                </span>
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max((row.value / max) * 100, 1.5)}%`, backgroundColor: colors[index] }}
              />
            </div>
          </li>
        ))}
      </ol>

      {hasStale && <p className="mt-4 text-xs font-semibold text-ink-secondary">Bazı veriler tekrar doğrulanmalı.</p>}
    </div>
  )
}
