'use client'

interface FileUploadInputProps {
  fileName: string
  onChange: (fileName: string) => void
}

export function FileUploadInput({ fileName, onChange }: FileUploadInputProps) {
  return (
    <div className="mb-8">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center hover:border-border-strong">
        <span className="text-sm text-ink-secondary">
          {fileName || 'Dosya seçmek için tıklayın'}
        </span>
        <input
          type="file"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0]?.name ?? '')}
        />
      </label>
    </div>
  )
}
