'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Feedback {
  id: string
  message: string
  is_read: boolean
  created_at: string
}

export default function FeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeedback()
  }, [])

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('is_read', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from('feedback').update({ is_read: true }).eq('id', id)
      if (error) throw error
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)))
    } catch (error) {
      console.error('Error marking feedback as read:', error)
    }
  }

  if (loading) {
    return <div className="text-ink-secondary">Yükleniyor...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink-primary mb-6">Geri Bildirimler</h1>

      {items.length === 0 ? (
        <div className="bg-surface-card rounded-lg border border-border p-6 text-ink-secondary">Henüz geri bildirim yok.</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-surface-card rounded-lg border border-border p-6 ${
                !item.is_read ? 'border-l-4 border-accent' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                {!item.is_read && (
                  <span className="inline-block px-2 py-1 bg-accent-tint text-accent-hover text-sm rounded-badge">
                    Okunmadı
                  </span>
                )}
                {!item.is_read && (
                  <button
                    onClick={() => markAsRead(item.id)}
                    className="px-3 py-1 bg-accent-tint text-accent-hover rounded-badge hover:bg-scale-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    Okundu işaretle
                  </button>
                )}
              </div>
              <div className="text-ink-primary whitespace-pre-line">{item.message}</div>
              <div className="data-figure mt-4 text-sm text-ink-secondary">
                {new Date(item.created_at).toLocaleDateString('tr-TR')}{' '}
                {new Date(item.created_at).toLocaleTimeString('tr-TR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
