'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ReadOnlyNotice } from '@/components/admin/ReadOnlyNotice'

interface Axis {
  id: string
  axis_model_id: string
  name: string
  description: string
  slug: string
  pole_negative: string | null
  pole_positive: string | null
  order_index: number
}

interface AxisModel {
  id: string
  name: string
  version: string
  is_active: boolean
}

export default function AxesPage() {
  const [models, setModels] = useState<AxisModel[]>([])
  const [axes, setAxes] = useState<Axis[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [modelsRes, axesRes] = await Promise.all([
          supabase
            .from('axis_models')
            .select('id, name, version, is_active')
            .order('created_at', { ascending: true }),
          supabase
            .from('axes')
            .select('id, axis_model_id, name, description, slug, pole_negative, pole_positive, order_index')
            .order('order_index', { ascending: true }),
        ])

        if (modelsRes.error) throw modelsRes.error
        if (axesRes.error) throw axesRes.error

        setModels((modelsRes.data ?? []) as AxisModel[])
        setAxes((axesRes.data ?? []) as Axis[])
      } catch (error) {
        console.error('Error fetching axes:', error)
        setErrorMessage('Eksenler yüklenemedi')
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  if (loading) {
    return <div className="text-ink-secondary">Yükleniyor...</div>
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-ink-primary">Eksenler</h1>
      <p className="mb-6 text-sm text-ink-secondary">
        Her eksen −100 ile +100 arası bir skaladır. Kullanıcı skoru ile parti konumu arasındaki fark
        eşleşme yüzdesini belirler.
      </p>

      <ReadOnlyNotice source="scripts/data/axis-model-v2.js" command="npm run v2:seed" />

      {errorMessage && (
        <div className="mb-4 rounded-badge border border-border-strong border-l-4 border-l-ink-primary bg-surface-muted p-3 text-sm text-ink-primary">
          {errorMessage}
        </div>
      )}

      {models.map((model) => {
        const modelAxes = axes.filter((axis) => axis.axis_model_id === model.id)
        if (modelAxes.length === 0) return null

        return (
          <section key={model.id} className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink-primary">
              {model.name}
              {model.is_active ? (
                <span className="rounded-badge bg-accent-tint px-2 py-0.5 text-xs text-accent-hover">aktif</span>
              ) : (
                <span className="rounded-badge bg-surface-muted px-2 py-0.5 text-xs text-ink-secondary">arşiv</span>
              )}
              <span className="data-figure text-sm font-normal text-ink-secondary">{modelAxes.length} eksen</span>
            </h2>

            <div className="space-y-3">
              {modelAxes.map((axis) => (
                <div key={axis.id} className="rounded-lg bg-surface-card p-4 border border-border">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-ink-primary">
                      {axis.order_index}. {axis.name}
                    </h3>
                    <code className="rounded-badge bg-surface-muted px-2 py-0.5 text-xs text-ink-secondary">
                      {axis.slug}
                    </code>
                  </div>
                  <p className="mt-1 text-sm text-ink-secondary">{axis.description}</p>

                  {(axis.pole_negative || axis.pole_positive) && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <Pole label="−100" text={axis.pole_negative} />
                      <Pole label="+100" text={axis.pole_positive} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function Pole({ label, text }: { label: string; text: string | null }) {
  return (
    <div className="rounded-badge bg-surface px-3 py-2">
      <span className="block data-figure text-xs font-semibold text-ink-secondary">{label}</span>
      <span className="text-sm text-ink-primary">{text ?? 'tanımlanmamış'}</span>
    </div>
  )
}
