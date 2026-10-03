'use client'

interface FileUploadInputProps {
  fileName: string
  onChange: (fileName: string) => void
}

export function FileUploadInput({ fileName, onChange }: FileUploadInputProps) {
  return (
    <div className="mb-8">
      {/* `hidden` input klavye odağından tamamen çıkıyordu; sr-only ile
          odaklanabilir kaldı ve odak halkası has-[:focus-visible] ile
          çerçeveye yansıyor. */}
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-button border-2 border-dashed border-border bg-surface-card p-8 text-center transition-all hover:border-border-strong hover:shadow-soft has-[:focus-visible]:border-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent">
        <span className="text-sm text-ink-secondary">
          {fileName || 'Dosya seçmek için tıklayın'}
        </span>
        <input
          type="file"
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0]?.name ?? '')}
        />
      </label>
    </div>
  )
}
