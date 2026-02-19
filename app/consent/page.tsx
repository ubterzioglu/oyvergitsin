'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function ConsentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAccept = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          ip_hash: Buffer.from(Date.now().toString()).toString('base64').substring(0, 64),
          device_hash: Buffer.from(navigator.userAgent).toString('base64').substring(0, 64),
          consent_version: 1,
          is_guest: true,
          risk_score: 0
        })
        .select()
        .single()

      if (error) throw error

      localStorage.setItem('sessionId', data.id)
      router.push('/survey')
    } catch (error) {
      console.error('Error creating session:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Açık Rıza Metni
        </h1>
        <div className="prose prose-gray max-w-none mb-8">
          <p className="text-gray-700 mb-4">
            Bu anket, siyasi görüşlerinizi analiz etmek ve size en yakın partileri göstermek amacıyla tasarlanmıştır.
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Cevaplarınız anonim olarak işlenecektir.</li>
            <li>Verileriniz sadece analiz amaçlı kullanılacaktır.</li>
            <li>Kişisel bilgileriniz asla üçüncü şahıslarla paylaşılmayacaktır.</li>
            <li>İstediğiniz zaman anketi durdurabilirsiniz.</li>
          </ul>
          <p className="text-gray-700 mt-4">
            Devam ederek yukarıdaki koşulları kabul etmiş sayılırsınız.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
          >
            {loading ? 'İşleniyor...' : 'Kabul Et ve Devam Et'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
          >
            Reddet
          </button>
        </div>
      </div>
    </div>
  )
}
