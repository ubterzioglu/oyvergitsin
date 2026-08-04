'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseConfigError } from '@/lib/supabase/config'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(
    searchParams.get('error') === 'not_admin'
      ? 'Bu hesabın yönetim paneline erişim yetkisi yok.'
      : ''
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMessage('')

    const configError = getSupabaseConfigError()
    if (configError) {
      setErrorMessage(configError)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { message?: string } | null
        throw new Error(payload?.message || 'Giriş yapılırken beklenmeyen bir hata oluştu.')
      }

      router.push('/admin')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setErrorMessage(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card elevated>
      <h1 className="mb-6 text-center font-heading text-2xl font-semibold text-ink-primary">
        Yönetim Paneli Girişi
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium text-ink-secondary">
            Kullanıcı adı
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-lg border border-border px-4 py-2 text-ink-primary focus:border-rainbow-blue focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-secondary">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-border px-4 py-2 text-ink-primary focus:border-rainbow-blue focus:outline-none"
          />
        </div>
        {errorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
        <Button type="submit" disabled={loading} variant="primary" className="w-full">
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </Button>
      </form>
    </Card>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <Container size="sm">
        <Suspense fallback={null}>
          <AdminLoginForm />
        </Suspense>
      </Container>
    </div>
  )
}
