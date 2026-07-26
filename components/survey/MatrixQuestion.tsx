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
                    <button
                      type="button"
                      role={multi ? 'checkbox' : 'radio'}
                      aria-checked={selected}
                      aria-label={`${row.text} - ${column.text}`}
                      onClick={() => toggle(row.value, column.value)}
                      className={`h-6 w-6 rounded-full border-2 transition-colors ${
                        selected ? 'border-rainbow-blue bg-rainbow-blue' : 'border-border hover:border-border-strong'
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
