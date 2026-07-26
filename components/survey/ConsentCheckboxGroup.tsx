'use client'

interface ConsentOption {
  id: string
  text: string
  value: string
}

interface ConsentCheckboxGroupProps {
  options: ConsentOption[]
  value: string[]
  onChange: (value: string[]) => void
}

export function ConsentCheckboxGroup({ options, value, onChange }: ConsentCheckboxGroupProps) {
  const toggle = (optionValue: string) => {
    const next = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    onChange(next)
  }

  return (
    <div className="mb-8 space-y-3">
      {options.map((option) => (
        <label
          key={option.id}
          className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-border p-4 hover:border-border-strong"
        >
          <input
            type="checkbox"
            checked={value.includes(option.value)}
            onChange={() => toggle(option.value)}
            className="h-5 w-5 accent-rainbow-blue"
          />
          <span className="text-ink-primary">{option.text}</span>
        </label>
      ))}
    </div>
  )
}
