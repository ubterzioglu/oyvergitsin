'use client'

interface MatrixRow {
  id: string
  text: string
  value: string
}

interface MatrixColumn {
  id: string
  text: string
  value: string
}

interface MatrixQuestionProps {
  rows: MatrixRow[]
  columns: MatrixColumn[]
  multi?: boolean
  value: Record<string, string[]>
  onChange: (value: Record<string, string[]>) => void
}

export function MatrixQuestion({ rows, columns, multi = false, value, onChange }: MatrixQuestionProps) {
  const toggle = (rowValue: string, columnValue: string) => {
    const current = value[rowValue] || []
    if (multi) {
      const next = current.includes(columnValue)
        ? current.filter((v) => v !== columnValue)
        : [...current, columnValue]
      onChange({ ...value, [rowValue]: next })
    } else {
      onChange({ ...value, [rowValue]: [columnValue] })
    }
  }

  return (
    <div className="mb-8 overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-2">
        <thead>
          <tr>
            <th className="text-left text-sm font-medium text-ink-secondary" />
            {columns.map((column) => (
              <th key={column.id} className="px-2 pb-2 text-center text-xs font-medium text-ink-secondary">
                {column.text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="pr-4 text-sm text-ink-primary">{row.text}</td>
              {columns.map((column) => {
                const selected = (value[row.value] || []).includes(column.value)
                return (
                  <td key={column.id} className="px-2 text-center">
                    {/* Seçili: dolu petrol daire (accent/kart 5.92, UI eşiği
                        3:1 üstü). İşaretsiz: ink-muted halka (4.79) — eski
                        border-border 1.30 ile 3:1 altındaydı. Durum yalnız
                        renkle taşınmıyor: dolu/boş şekil farkı + aria-checked
                        ikinci ayırt edici. */}
                    <button
                      type="button"
                      role={multi ? 'checkbox' : 'radio'}
                      aria-checked={selected}
                      aria-label={`${row.text} - ${column.text}`}
                      onClick={() => toggle(row.value, column.value)}
                      className={`h-6 w-6 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                        selected
                          ? 'border-accent bg-accent'
                          : 'border-ink-muted bg-surface-card hover:border-accent'
                      }`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
