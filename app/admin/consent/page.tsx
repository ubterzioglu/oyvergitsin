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
    return <div className="text-gray-600">Yükleniyor...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Onay Metinleri</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Yeni Versiyon Ekle
        </button>
      </div>

      <div className="space-y-4">
        {consents.map((consent) => (
          <div key={consent.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Versiyon {consent.version}
                </h3>
                {consent.is_active && (
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                    Aktif
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                  Düzenle
                </button>
                <button className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">
                  Sil
                </button>
              </div>
            </div>
            <div className="text-gray-700 whitespace-pre-line">{consent.text}</div>
            <div className="mt-4 text-sm text-gray-500">
              Oluşturulma: {new Date(consent.created_at).toLocaleDateString('tr-TR')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
