'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface ConsentText {
  id: string
  version: number
  text: string
  is_active: boolean
  created_at: string
}

export default function ConsentPage() {
  const [consents, setConsents] = useState<ConsentText[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConsents()
  }, [])

  const fetchConsents = async () => {
    try {
      const { data, error } = await supabase
        .from('consent_texts')
        .select('*')
        .order('version', { ascending: false })

      if (error) throw error
      setConsents(data || [])
    } catch (error) {
      console.error('Error fetching consents:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-ink-secondary">Yükleniyor...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-ink-primary">Onay Metinleri</h1>
        <button className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
          Yeni Versiyon Ekle
        </button>
      </div>

      <div className="space-y-4">
        {consents.map((consent) => (
          <div key={consent.id} className="bg-surface-card rounded-lg border border-border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="data-figure text-xl font-bold text-ink-primary">
                  Versiyon {consent.version}
                </h3>
                {consent.is_active && (
                  <span className="inline-block px-2 py-1 bg-accent-tint text-accent-hover text-sm rounded-badge">
                    Aktif
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-accent-tint text-accent-hover rounded-badge hover:bg-scale-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                  Düzenle
                </button>
                <button className="px-3 py-1 bg-surface-muted text-ink-primary rounded-badge hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                  Sil
                </button>
              </div>
            </div>
            <div className="text-ink-primary whitespace-pre-line">{consent.text}</div>
            <div className="data-figure mt-4 text-sm text-ink-secondary">
              Oluşturulma: {new Date(consent.created_at).toLocaleDateString('tr-TR')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
