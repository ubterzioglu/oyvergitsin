'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { TextField, TextAreaField, SelectField, CheckboxField } from '@/components/admin/FormField'
import { ReorderButtons } from '@/components/admin/ReorderButtons'
import { QUESTION_TYPES, isOptionBasedType } from '@/lib/admin/questionTypes'
import {
  validateQuestionForm,
  validateOptionForm,
  validateScoringRuleForm,
} from '@/lib/admin/validation'

interface Question {
  id: string
  text: string
  type: string
  description: string | null
  required: boolean
  order_index: number
}

interface QuestionOption {
  id: string
  question_id: string
  text: string
  value: string
  order_index: number
}

interface Axis {
  id: string
  name: string
  slug: string
}

interface ScoringRule {
  id: string
  question_id: string
  answer_value: string
  axis_id: string
  score_modifier: number
}

export default function QuestionDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const questionId = params.id

  const [question, setQuestion] = useState<Question | null>(null)
  const [options, setOptions] = useState<QuestionOption[]>([])
  const [axes, setAxes] = useState<Axis[]>([])
  const [rules, setRules] = useState<ScoringRule[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [questionForm, setQuestionForm] = useState({
    text: '',
    description: '',
    type: '',
    required: true,
    order_index: '0',
  })
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({})
  const [savingQuestion, setSavingQuestion] = useState(false)

  const [newOption, setNewOption] = useState({ text: '', value: '' })
  const [optionErrors, setOptionErrors] = useState<Record<string, string>>({})
  const [savingOption, setSavingOption] = useState(false)
  const [deleteOptionTarget, setDeleteOptionTarget] = useState<QuestionOption | null>(null)

  const [newRule, setNewRule] = useState({ answer_value: '', axis_id: '', score_modifier: '0' })
  const [ruleErrors, setRuleErrors] = useState<Record<string, string>>({})
  const [savingRule, setSavingRule] = useState(false)
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<ScoringRule | null>(null)

  useEffect(() => {
    fetchAll()
  }, [questionId])

  const fetchAll = async () => {
    try {
      setErrorMessage('')
      const [questionRes, optionsRes, axesRes, rulesRes] = await Promise.all([
        supabase.from('questions').select('*').eq('id', questionId).single(),
        supabase.from('question_options').select('*').eq('question_id', questionId).order('order_index'),
        supabase.from('axes').select('id, name, slug').order('order_index'),
        supabase.from('scoring_rules').select('*').eq('question_id', questionId),
      ])

      if (questionRes.error) throw questionRes.error
      if (optionsRes.error) throw optionsRes.error
      if (axesRes.error) throw axesRes.error
      if (rulesRes.error) throw rulesRes.error

      setQuestion(questionRes.data)
      setQuestionForm({
        text: questionRes.data.text,
        description: questionRes.data.description ?? '',
        type: questionRes.data.type,
        required: questionRes.data.required,
        order_index: String(questionRes.data.order_index),
      })
      setOptions(optionsRes.data || [])
      setAxes(axesRes.data || [])
      setRules(rulesRes.data || [])
    } catch (error) {
      console.error('Error loading question detail:', error)
      setErrorMessage('Soru bulunamadı veya yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveQuestion = async (event: React.FormEvent) => {
    event.preventDefault()

    const result = validateQuestionForm(questionForm)
    if (!result.valid) {
      setQuestionErrors(result.errors)
      return
    }

    setSavingQuestion(true)
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          text: questionForm.text.trim(),
          description: questionForm.description.trim() || null,
          type: questionForm.type,
          required: questionForm.required,
          order_index: Number(questionForm.order_index),
        })
        .eq('id', questionId)

      if (error) throw error
      setQuestionErrors({})
      await fetchAll()
    } catch (error) {
      console.error('Error saving question:', error)
      setQuestionErrors({ form: 'Soru kaydedilemedi.' })
    } finally {
      setSavingQuestion(false)
    }
  }

  const handleAddOption = async (event: React.FormEvent) => {
    event.preventDefault()

    const result = validateOptionForm(newOption)
    if (!result.valid) {
      setOptionErrors(result.errors)
      return
    }

    setSavingOption(true)
    try {
      const { error } = await supabase.from('question_options').insert({
        question_id: questionId,
        text: newOption.text.trim(),
        value: newOption.value.trim(),
        order_index: options.length + 1,
      })

      if (error) throw error
      setNewOption({ text: '', value: '' })
      setOptionErrors({})
      await fetchAll()
    } catch (error) {
      console.error('Error adding option:', error)
      setOptionErrors({ form: 'Seçenek eklenemedi.' })
    } finally {
      setSavingOption(false)
    }
  }

  const handleDeleteOption = async () => {
    if (!deleteOptionTarget) return

    try {
      const { error } = await supabase.from('question_options').delete().eq('id', deleteOptionTarget.id)
      if (error) throw error
      setDeleteOptionTarget(null)
      await fetchAll()
    } catch (error) {
      console.error('Error deleting option:', error)
      setErrorMessage('Seçenek silinemedi.')
    }
  }

  const moveOption = async (option: QuestionOption, direction: 'up' | 'down') => {
    const sorted = [...options].sort((a, b) => a.order_index - b.order_index)
    const index = sorted.findIndex((o) => o.id === option.id)
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sorted.length) return

    const neighbor = sorted[swapIndex]

    try {
      await Promise.all([
        supabase.from('question_options').update({ order_index: neighbor.order_index }).eq('id', option.id),
        supabase.from('question_options').update({ order_index: option.order_index }).eq('id', neighbor.id),
      ])
      await fetchAll()
    } catch (error) {
      console.error('Error reordering options:', error)
      setErrorMessage('Seçenek sıralaması güncellenemedi.')
    }
  }

  const handleAddRule = async (event: React.FormEvent) => {
    event.preventDefault()

    const result = validateScoringRuleForm(newRule, rules)
    if (!result.valid) {
      setRuleErrors(result.errors)
      return
    }

    setSavingRule(true)
    try {
      const { error } = await supabase.from('scoring_rules').insert({
        question_id: questionId,
        answer_value: newRule.answer_value.trim(),
        axis_id: newRule.axis_id,
        score_modifier: Number(newRule.score_modifier),
      })

      if (error) throw error
      setNewRule({ answer_value: '', axis_id: '', score_modifier: '0' })
      setRuleErrors({})
      await fetchAll()
    } catch (error) {
      console.error('Error adding scoring rule:', error)
      setRuleErrors({ form: 'Puanlama kuralı eklenemedi.' })
    } finally {
      setSavingRule(false)
    }
  }

  const handleDeleteRule = async () => {
    if (!deleteRuleTarget) return

    try {
      const { error } = await supabase.from('scoring_rules').delete().eq('id', deleteRuleTarget.id)
      if (error) throw error
      setDeleteRuleTarget(null)
      await fetchAll()
    } catch (error) {
      console.error('Error deleting scoring rule:', error)
      setErrorMessage('Puanlama kuralı silinemedi.')
    }
  }

  const axisName = (axisId: string) => axes.find((a) => a.id === axisId)?.name ?? axisId

  if (loading) {
    return <div className="text-gray-600">Yükleniyor...</div>
  }

  if (!question) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {errorMessage || 'Soru bulunamadı.'}
      </div>
    )
  }

  const sortedOptions = [...options].sort((a, b) => a.order_index - b.order_index)
  const showOptionSections = isOptionBasedType(questionForm.type)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/questions" className="text-sm text-blue-600 hover:text-blue-900">
            ← Sorulara dön
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Soruyu Düzenle</h1>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <form
        onSubmit={handleSaveQuestion}
        className="space-y-4 rounded-lg border border-border bg-surface-card p-6"
      >
        <h2 className="font-heading text-lg font-semibold text-ink-primary">Temel Bilgiler</h2>
        {questionErrors.form ? <p className="text-sm text-red-600">{questionErrors.form}</p> : null}
        <TextAreaField
          id="question-text"
          label="Soru metni"
          value={questionForm.text}
          onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
          error={questionErrors.text}
          rows={2}
        />
        <TextAreaField
          id="question-description"
          label="Açıklama (opsiyonel)"
          value={questionForm.description}
          onChange={(e) => setQuestionForm({ ...questionForm, description: e.target.value })}
          rows={2}
        />
        <SelectField
          id="question-type"
          label="Soru tipi"
          value={questionForm.type}
          onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value })}
          error={questionErrors.type}
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </SelectField>
        <TextField
          id="question-order"
          label="Sıra"
          type="number"
          value={questionForm.order_index}
          onChange={(e) => setQuestionForm({ ...questionForm, order_index: e.target.value })}
          error={questionErrors.order_index}
        />
        <CheckboxField
          id="question-required"
          label="Zorunlu soru"
          checked={questionForm.required}
          onChange={(e) => setQuestionForm({ ...questionForm, required: e.target.checked })}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={savingQuestion}>
            {savingQuestion ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>

      {!showOptionSections ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Bu soru tipi seçenek gerektirmez (serbest giriş: metin, sayı, tarih, dosya, kaydırıcı
          veya CAPTCHA). Aşağıdaki &ldquo;Seçenekler&rdquo; bölümünü boş bırakabilirsiniz.
        </div>
      ) : null}
      {questionForm.type === 'matrix_single' || questionForm.type === 'matrix_multi' ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Matris sorularda seçenek değerine satırlar için <code>row:</code>, sütunlar için{' '}
          <code>col:</code> öneki ekleyin (örn. <code>row:economy</code>,{' '}
          <code>col:strongly_agree</code>).
        </div>
      ) : null}

      <div className="space-y-4 rounded-lg border border-border bg-surface-card p-6">
        <h2 className="font-heading text-lg font-semibold text-ink-primary">Seçenekler</h2>

        {sortedOptions.length === 0 ? (
          <p className="text-sm text-ink-secondary">Henüz seçenek eklenmedi.</p>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="py-2">Sıra</th>
                <th className="py-2">Metin</th>
                <th className="py-2">Değer</th>
                <th className="py-2">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedOptions.map((option, index) => (
                <tr key={option.id}>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <ReorderButtons
                        onMoveUp={() => moveOption(option, 'up')}
                        onMoveDown={() => moveOption(option, 'down')}
                        disableUp={index === 0}
                        disableDown={index === sortedOptions.length - 1}
                      />
                      {option.order_index}
                    </div>
                  </td>
                  <td className="py-2 text-sm text-ink-primary">{option.text}</td>
                  <td className="py-2 text-sm text-ink-secondary">{option.value}</td>
                  <td className="py-2 text-sm">
                    <button
                      onClick={() => setDeleteOptionTarget(option)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form onSubmit={handleAddOption} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
          {optionErrors.form ? (
            <p className="col-span-full text-sm text-red-600">{optionErrors.form}</p>
          ) : null}
          <TextField
            id="new-option-text"
            label="Seçenek metni"
            value={newOption.text}
            onChange={(e) => setNewOption({ ...newOption, text: e.target.value })}
            error={optionErrors.text}
          />
          <TextField
            id="new-option-value"
            label="Seçenek değeri"
            value={newOption.value}
            onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
            error={optionErrors.value}
            placeholder="market"
          />
          <div className="flex items-end">
            <Button type="submit" disabled={savingOption} className="w-full">
              {savingOption ? 'Ekleniyor...' : 'Seçenek Ekle'}
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-surface-card p-6">
        <h2 className="font-heading text-lg font-semibold text-ink-primary">Puanlama Kuralları</h2>
        <p className="text-sm text-ink-secondary">
          Bir cevap değeri (seçenek değeriyle eşleşmeli) işaretlendiğinde ilgili eksene eklenecek
          puanı tanımlar.
        </p>

        {rules.length === 0 ? (
          <p className="text-sm text-ink-secondary">Henüz puanlama kuralı eklenmedi.</p>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="py-2">Cevap değeri</th>
                <th className="py-2">Eksen</th>
                <th className="py-2">Puan</th>
                <th className="py-2">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="py-2 text-sm text-ink-primary">{rule.answer_value}</td>
                  <td className="py-2 text-sm text-ink-secondary">{axisName(rule.axis_id)}</td>
                  <td className="py-2 text-sm text-ink-secondary">{rule.score_modifier}</td>
                  <td className="py-2 text-sm">
                    <button
                      onClick={() => setDeleteRuleTarget(rule)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form onSubmit={handleAddRule} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-4">
          {ruleErrors.form ? <p className="col-span-full text-sm text-red-600">{ruleErrors.form}</p> : null}
          <TextField
            id="new-rule-answer"
            label="Cevap değeri"
            value={newRule.answer_value}
            onChange={(e) => setNewRule({ ...newRule, answer_value: e.target.value })}
            error={ruleErrors.answer_value}
            placeholder="market"
            list="option-values"
          />
          <datalist id="option-values">
            {sortedOptions.map((o) => (
              <option key={o.id} value={o.value} />
            ))}
          </datalist>
          <SelectField
            id="new-rule-axis"
            label="Eksen"
            value={newRule.axis_id}
            onChange={(e) => setNewRule({ ...newRule, axis_id: e.target.value })}
            error={ruleErrors.axis_id}
          >
            <option value="">Seçiniz</option>
            {axes.map((axis) => (
              <option key={axis.id} value={axis.id}>
                {axis.name}
              </option>
            ))}
          </SelectField>
          <TextField
            id="new-rule-score"
            label="Puan (-100..100)"
            type="number"
            min={-100}
            max={100}
            value={newRule.score_modifier}
            onChange={(e) => setNewRule({ ...newRule, score_modifier: e.target.value })}
            error={ruleErrors.score_modifier}
          />
          <div className="flex items-end">
            <Button type="submit" disabled={savingRule} className="w-full">
              {savingRule ? 'Ekleniyor...' : 'Kural Ekle'}
            </Button>
          </div>
        </form>
      </div>

      {deleteOptionTarget ? (
        <ConfirmDialog
          title="Seçeneği sil"
          message={`"${deleteOptionTarget.text}" seçeneğini silmek istediğinize emin misiniz?`}
          onConfirm={handleDeleteOption}
          onCancel={() => setDeleteOptionTarget(null)}
        />
      ) : null}

      {deleteRuleTarget ? (
        <ConfirmDialog
          title="Puanlama kuralını sil"
          message={`"${deleteRuleTarget.answer_value}" cevabı için tanımlı puanlama kuralını silmek istediğinize emin misiniz?`}
          onConfirm={handleDeleteRule}
          onCancel={() => setDeleteRuleTarget(null)}
        />
      ) : null}
    </div>
  )
}
