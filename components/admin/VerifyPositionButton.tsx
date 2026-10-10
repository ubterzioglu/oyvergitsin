'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function VerifyPositionButton({ positionId }: { positionId: string }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle')

  const verify = async () => {
    setState('busy')
    try {
      const response = await fetch('/api/admin/party-positions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId }),
      })
      if (!response.ok) {
        throw new Error('verify failed')
      }
      setState('idle')
      router.refresh()
    } catch {
      setState('error')
    }
  }

  return (
    <button
      type="button"
      onClick={verify}
      disabled={state === 'busy'}
      className="rounded-button border border-border-strong px-3 py-1.5 text-xs font-semibold text-ink-primary transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:text-ink-secondary"
    >
      {state === 'busy' ? 'Kaydediliyor…' : state === 'error' ? 'Hata, tekrar dene' : 'Doğrulandı'}
    </button>
  )
}
