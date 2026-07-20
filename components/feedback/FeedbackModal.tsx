'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface FeedbackModalProps {
  onClose: () => void
}

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Lütfen bir mesaj yazın.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Geri bildirim gönderilemedi.')
      }

      setSent(true)
      setTimeout(onClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geri bildirim gönderilemedi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-card bg-surface-card p-6 shadow-elevated">
        <h2 className="mb-2 font-heading text-lg font-semibold text-ink-primary">Geri Bildirim Ver</h2>
        <p className="mb-4 text-sm text-ink-secondary">
          Görüşleriniz bizim için önemli. Mesajınız anonim olarak iletilir.
        </p>

        {sent ? (
          <p className="text-sm font-medium text-ink-primary">Teşekkürler, geri bildiriminiz alındı.</p>
        ) : (
          <>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="Görüş, öneri veya sorununuzu yazın..."
              disabled={loading}
              className="w-full rounded-button border border-border bg-white px-3 py-2 text-sm text-ink-primary focus:border-rainbow-blue focus:outline-none disabled:opacity-50"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose} disabled={loading}>
                Vazgeç
              </Button>
              <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Gönderiliyor...' : 'Gönder'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
