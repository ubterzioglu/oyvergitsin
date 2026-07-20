'use client'

import { useState } from 'react'
import { FeedbackModal } from '@/components/feedback/FeedbackModal'

interface FeedbackButtonProps {
  className?: string
}

export function FeedbackButton({ className = '' }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Geri Bildirim Ver
      </button>
      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  )
}
