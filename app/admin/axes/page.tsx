'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { TextField, TextAreaField } from '@/components/admin/FormField'
import { ReorderButtons } from '@/components/admin/ReorderButtons'
import { validateAxisForm } from '@/lib/admin/validation'

interface Axis {
  id: string
  axis_model_id: string
  name: string
  description: string
  slug: string
  order_index: number
}

interface AxisFormState {
  name: string
  description: string
  slug: string
  order_index: string
}

const EMPTY_FORM: AxisFormState = { name: '', description: '', slug: '', order_index: '0' }

export default function AxesPage() {
  const [axes, setAxes] = useState<Axis[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [form, setForm] = useState<AxisFormState>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Axis | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchAxes()
  }, [])

  const fetchAxes = async () => {
    try {
      setErrorMessage('')
      const { data, error } = await supabase
        .from('axes')
        .select('*')
        .order('order_index', { ascending: true })

      if (error) throw error
      setAxes(data || [])
    } catch (error) {
      console.error('Error fetching axes:', error)
      setErrorMessage('Eksenler yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  const openCreateForm = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, order_index: String(axes.length + 1) })
    setFormErrors({})
    setShowCreateForm(true)
  }

  const openEditForm = (axis: Axis) => {
    setEditingId(axis.id)
    setForm({
      name: axis.name,
      description: axis.description,
      slug: axis.slug,
      order_index: String(axis.order_index),
    })
    setFormErrors({})
    setShowCreateForm(true)
  }

  const closeForm = () => {
    setShowCreateForm(false)
    setEditingId(null)
    setFormErrors({})
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const result = validateAxisForm(form)
    if (!result.valid) {
      setFormErrors(result.errors)
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase
          .from('axes')
          .update({
            name: form.name.trim(),
            description: form.description.trim(),
            slug: form.slug.trim(),
            order_index: Number(form.order_index),
          })
          .eq('id', editingId)

        if (error) throw error
      } else {
        const activeModel = await supabase
          .from('axis_models')
          .select('id')
          .eq('is_active', true)
          .limit(1)
          .single()

        if (activeModel.error || !activeModel.data) {
          throw new Error('Aktif eksen modeli bulunamadı')
        }

        const { error } = await supabase.from('axes').insert({
          axis_model_id: activeModel.data.id,
          name: form.name.trim(),
          description: form.description.trim(),
          slug: form.slug.trim(),
          order_index: Number(form.order_index),
        })

        if (error) throw error
      }

      closeForm()
      await fetchAxes()
    } catch (error) {
      console.error('Error saving axis:', error)
      const message = error instanceof Error ? error.message : 'Eksen kaydedilemedi'
      setFormErrors({ form: message })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      const { error } = await supabase.from('axes').delete().eq('id', deleteTarget.id)
      if (error) throw error
      setDeleteTarget(null)
      await fetchAxes()
    } catch (error) {
      console.error('Error deleting axis:', error)
      setErrorMessage('Eksen silinemedi.')
    } finally {
      setDeleting(false)
    }
  }

  const moveAxis = async (axis: Axis, direction: 'up' | 'down') => {
    const sorted = [...axes].sort((a, b) => a.order_index - b.order_index)
    const index = sorted.findIndex((a) => a.id === axis.id)
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sorted.length) return

    const neighbor = sorted[swapIndex]

    try {
      await Promise.all([
        supabase.from('axes').update({ order_index: neighbor.order_index }).eq('id', axis.id),
        supabase.from('axes').update({ order_index: axis.order_index }).eq('id', neighbor.id),
      ])
      await fetchAxes()
    } catch (error) {
      console.error('Error reordering axes:', error)
      setErrorMessage('Sıralama güncellenemedi.')
    }
  }

  if (loading) {
    return <div className="text-gray-600">Yükleniyor...</div>
  }

  const sortedAxes = [...axes].sort((a, b) => a.order_index - b.order_index)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Eksenler</h1>
        <Button onClick={openCreateForm}>Yeni Eksen Ekle</Button>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {showCreateForm ? (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 rounded-lg border border-border bg-surface-card p-6"
        >
          <h2 className="font-heading text-lg font-semibold text-ink-primary">
            {editingId ? 'Ekseni Düzenle' : 'Yeni Eksen'}
          </h2>
          {formErrors.form ? <p className="text-sm text-red-600">{formErrors.form}</p> : null}
          <TextField
            id="axis-name"
            label="Ad"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={formErrors.name}
          />
          <TextAreaField
            id="axis-description"
            label="Açıklama"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            error={formErrors.description}
            rows={3}
          />
          <TextField
            id="axis-slug"
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            error={formErrors.slug}
            placeholder="economy_market_state"
          />
          <TextField
            id="axis-order"
            label="Sıra"
            type="number"
            value={form.order_index}
            onChange={(e) => setForm({ ...form, order_index: e.target.value })}
            error={formErrors.order_index}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeForm} disabled={saving}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      ) : null}

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
            {sortedAxes.map((axis, index) => (
              <tr key={axis.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    <ReorderButtons
                      onMoveUp={() => moveAxis(axis, 'up')}
                      onMoveDown={() => moveAxis(axis, 'down')}
                      disableUp={index === 0}
                      disableDown={index === sortedAxes.length - 1}
                    />
                    {axis.order_index}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {axis.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{axis.slug}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => openEditForm(axis)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => setDeleteTarget(axis)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteTarget ? (
        <ConfirmDialog
          title="Ekseni sil"
          message={`"${deleteTarget.name}" eksenini silmek istediğinize emin misiniz? Bu eksene bağlı puanlama kuralları ve parti pozisyonları da silinecektir.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      ) : null}
    </div>
  )
}
