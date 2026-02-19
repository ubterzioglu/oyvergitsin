'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Party {
  id: string
  name: string
  short_name: string
  color: string
  description: string
}

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchParties()
  }, [])

  const fetchParties = async () => {
    try {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .order('short_name', { ascending: true })

      if (error) throw error
      setParties(data || [])
    } catch (error) {
      console.error('Error fetching parties:', error)
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
        <h1 className="text-3xl font-bold text-gray-900">Partiler</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Yeni Parti Ekle
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kısaltma
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Renk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parties.map((party) => (
              <tr key={party.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="inline-block px-3 py-1 rounded-full text-white text-sm font-bold"
                    style={{ backgroundColor: party.color }}
                  >
                    {party.short_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {party.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: party.color }}
                    />
                    <span>{party.color}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">
                    Düzenle
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
