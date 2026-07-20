'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Source {
  id: string
  name: string
  source_type: string
  endpoint_url: string
  language: string | null
  trust_level: string
  is_enabled: boolean
  terms_checked: boolean
  last_success_at: string | null
  last_error_message: string | null
}

interface NewSourceForm {
  name: string
  source_type: 'rss' | 'atom'
  endpoint_url: string
  language: string
  trust_level: 'official' | 'high' | 'standard' | 'discovery_only'
}

const EMPTY_FORM: NewSourceForm = {
  name: '',
  source_type: 'rss',
  endpoint_url: '',
  language: 'tr',
  trust_level: 'standard'
}

function formatDate(value: string | null): string {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('tr-TR')
}

export default function RadarSourcesPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<NewSourceForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSources = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('news_sources')
        .select(
          'id, name, source_type, endpoint_url, language, trust_level, is_enabled, terms_checked, last_success_at, last_error_message'
        )
        .order('name', { ascending: true })

      if (fetchError) throw fetchError
      setSources((data as Source[]) || [])
    } catch (err) {
      console.error('Error fetching sources:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSources()
  }, [])

  const toggleField = async (source: Source, field: 'is_enabled' | 'terms_checked') => {
    try {
      const { error: updateError } = await supabase
        .from('news_sources')
        .update({ [field]: !source[field] })
        .eq('id', source.id)

      if (updateError) throw updateError
      await fetchSources()
    } catch (err) {
      console.error('Error toggling source:', err)
    }
  }

  const addSource = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { error: insertError } = await supabase.from('news_sources').insert({
        name: form.name,
        source_type: form.source_type,
        endpoint_url: form.endpoint_url,
        language: form.language || null,
        trust_level: form.trust_level
      })

      if (insertError) throw insertError
      setForm(EMPTY_FORM)
      await fetchSources()
    } catch (err) {
      console.error('Error adding source:', err)
      setError('Kaynak eklenemedi.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-gray-600">Yükleniyor...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Haber Kaynakları</h1>
        <a
          href="/admin/radar"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Adaylar
        </a>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Yeni Kaynak Ekle</h2>
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        <form onSubmit={addSource} className="grid gap-4 md:grid-cols-2">
          <input
            required
            placeholder="Ad"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            required
            placeholder="Endpoint URL"
            value={form.endpoint_url}
            onChange={(e) => setForm({ ...form, endpoint_url: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <select
            value={form.source_type}
            onChange={(e) => setForm({ ...form, source_type: e.target.value as NewSourceForm['source_type'] })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="rss">RSS</option>
            <option value="atom">Atom</option>
          </select>
          <input
            placeholder="Dil (örn. tr)"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <select
            value={form.trust_level}
            onChange={(e) => setForm({ ...form, trust_level: e.target.value as NewSourceForm['trust_level'] })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="official">official</option>
            <option value="high">high</option>
            <option value="standard">standard</option>
            <option value="discovery_only">discovery_only</option>
          </select>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Ekle'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tür</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktif</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Şartlar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Son Başarı</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Son Hata</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sources.map((source) => (
              <tr key={source.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{source.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{source.source_type}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{source.endpoint_url}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => toggleField(source, 'is_enabled')}
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      source.is_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {source.is_enabled ? 'Açık' : 'Kapalı'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => toggleField(source, 'terms_checked')}
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      source.terms_checked ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {source.terms_checked ? 'Onaylı' : 'Bekliyor'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(source.last_success_at)}</td>
                <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">{source.last_error_message || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
