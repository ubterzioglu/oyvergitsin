'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseConfigError } from '@/lib/supabase/config'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'

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
    <div className="min-h-screen bg-surface px-4 py-4 sm:py-6">
      <Container size="md" className="flex flex-col items-center">
        <Card elevated className="w-full max-w-xl">
          <h1 className="mb-6 text-center font-heading text-3xl font-semibold text-ink-primary">
            Açık Rıza Metni
          </h1>
          <div className="prose prose-neutral mb-8 max-w-none">
            <p className="mb-4 text-ink-secondary">
              Bu anket, siyasi görüşlerinizi analiz etmek ve size en yakın partileri göstermek amacıyla tasarlanmıştır.
            </p>
            <ul className="list-disc space-y-2 pl-6 text-ink-secondary">
              <li>Cevaplarınız anonim olarak işlenecektir.</li>
              <li>Verileriniz sadece analiz amaçlı kullanılacaktır.</li>
              <li>Kişisel bilgileriniz asla üçüncü şahıslarla paylaşılmayacaktır.</li>
              <li>İstediğiniz zaman anketi durdurabilirsiniz.</li>
            </ul>
            <p className="mt-4 text-ink-secondary">
              Devam ederek yukarıdaki koşulları kabul etmiş sayılırsınız.
            </p>
          </div>
          {errorMessage ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
          <div className="flex justify-center gap-4">
            <Button onClick={handleAccept} disabled={loading} variant="primary">
              {loading ? 'İşleniyor...' : 'Kabul Et ve Devam Et'}
            </Button>
            <Button onClick={() => router.push('/')} variant="secondary">
              Reddet
            </Button>
          </div>
        </Card>
      </Container>
    </div>
  )
}
