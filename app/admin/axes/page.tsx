'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Axis {
  id: string
  name: string
  description: string
  slug: string
  order_index: number
}

export default function AxesPage() {
  const [axes, setAxes] = useState<Axis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAxes()
  }, [])

  const fetchAxes = async () => {
    try {
      const { data, error } = await supabase
        .from('axes')
        .select('*')
        .order('order_index', { ascending: true })

      if (error) throw error
      setAxes(data || [])
    } catch (error) {
      console.error('Error fetching axes:', error)
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
        <h1 className="text-3xl font-bold text-gray-900">Eksenler</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Yeni Eksen Ekle
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sıra
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {axes.map((axis) => (
              <tr key={axis.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {axis.order_index}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {axis.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {axis.slug}
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
