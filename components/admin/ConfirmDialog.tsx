'use client'

import { Button } from '@/components/ui/Button'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Sil',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-card bg-surface-card p-6 shadow-elevated">
        <h2 className="mb-2 font-heading text-lg font-semibold text-ink-primary">{title}</h2>
        <p className="mb-6 text-sm text-ink-secondary">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {loading ? 'Siliniyor...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
