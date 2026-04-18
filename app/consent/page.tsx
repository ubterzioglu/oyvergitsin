'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseConfigError } from '@/lib/supabase/config'

export default function ConsentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleAccept = async () => {
    setErrorMessage('')
    setLoading(true)

    const configError = getSupabaseConfigError()
    if (configError) {
      setErrorMessage(configError)
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isGuest: true })
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create session')
      }

      localStorage.setItem('sessionId', payload.sessionId)
      router.push('/survey')
    } catch (error) {
      console.error('Error creating session:', error)
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('Failed to fetch') || message.includes('ERR_NAME_NOT_RESOLVED')) {
        setErrorMessage(
          'Supabase baglantisi kurulamadigi icin oturum olusturulamadi. .env.local dosyasindaki NEXT_PUBLIC_SUPABASE_URL degerini kontrol edin.'
        )
      } else {
        setErrorMessage('Oturum olusturulurken beklenmeyen bir hata olustu. Lutfen tekrar deneyin.')
      }
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
        {errorMessage ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
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
