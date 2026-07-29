import {
  MATRIX_TYPES,
  MULTI_VALUE_TYPES,
  SINGLE_VALUE_TYPES,
  UNSCORED_TYPES,
} from './constants'
import type { ParsedAnswer } from './types'

/**
 * `answers.answer_value` düz string olarak saklanır; serileştirme biçimi soru
 * tipine göre değişir (bkz. app/survey/page.tsx):
 *   - tek değerli tipler       -> ham string
 *   - ranking                  -> "a,b,c"
 *   - çoklu seçim              -> JSON dizi
 *   - matris                   -> JSON { satır: [sütun, ...] }
 *   - puan dağıtımı            -> JSON { seçenek: pay }
 *
 * Bu fonksiyon hiçbir koşulda hata fırlatmaz: bozuk veri `invalid` döner ve
 * motor o maddeyi hem paydan hem paydadan düşer. Aksi halde tek bir bozuk satır
 * tüm sonuç isteğini 500'e düşürürdü.
 */
export function parseAnswerValue(questionType: string, raw: string | null | undefined): ParsedAnswer {
  if (typeof raw !== 'string') return { kind: 'invalid' }

  const trimmed = raw.trim()
  if (trimmed.length === 0) return { kind: 'invalid' }

  if (SINGLE_VALUE_TYPES.has(questionType) || questionType === 'attention_check') {
    return { kind: 'single', value: trimmed }
  }

  if (MULTI_VALUE_TYPES.has(questionType)) {
    const values = parseStringArray(trimmed)
    return values.length > 0 ? { kind: 'multi', values } : { kind: 'invalid' }
  }

  if (questionType === 'ranking') {
    const order = trimmed
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
    return order.length > 0 ? { kind: 'ranking', order } : { kind: 'invalid' }
  }

  if (MATRIX_TYPES.has(questionType)) {
    const rows = parseMatrixRows(trimmed)
    return rows ? { kind: 'matrix', rows } : { kind: 'invalid' }
  }

  if (questionType === 'allocation') {
    const shares = parseShares(trimmed)
    return shares ? { kind: 'allocation', shares } : { kind: 'invalid' }
  }

  if (questionType === 'slider_0_100' || questionType === 'numeric_input') {
    const value = Number(trimmed)
    return Number.isFinite(value) ? { kind: 'numeric', value } : { kind: 'invalid' }
  }

  if (UNSCORED_TYPES.has(questionType)) {
    return { kind: 'text', value: trimmed }
  }

  // Bilinmeyen tip: skora sokmak yerine sessizce dışarıda bırak.
  return { kind: 'invalid' }
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

/**
 * JSON dizi ya da virgülle ayrılmış liste kabul eder.
 *
 * Virgül yedeği yalnızca değer JSON'a benzemiyorsa devreye girer. Aksi halde
 * bozuk bir JSON ("{eksik tırnak") tek elemanlı geçerli bir liste gibi
 * görünür, hiçbir kurala eşleşmez ama maddeyi paydaya sokarak eksen skorunu
 * sessizce sıfıra doğru çeker.
 */
function parseStringArray(raw: string): string[] {
  if (raw.startsWith('[') || raw.startsWith('{')) {
    const parsed = safeJsonParse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && item.length > 0)
      : []
  }

  return raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}

function parseMatrixRows(raw: string): Record<string, string[]> | null {
  const parsed = safeJsonParse(raw)
  if (!isPlainObject(parsed)) return null

  const rows: Record<string, string[]> = {}

  for (const [rowKey, columns] of Object.entries(parsed)) {
    if (!Array.isArray(columns)) continue
    const values = columns.filter((item): item is string => typeof item === 'string' && item.length > 0)
    if (values.length > 0) {
      rows[rowKey] = values
    }
  }

  return Object.keys(rows).length > 0 ? rows : null
}

function parseShares(raw: string): Record<string, number> | null {
  const parsed = safeJsonParse(raw)
  if (!isPlainObject(parsed)) return null

  const shares: Record<string, number> = {}

  for (const [key, value] of Object.entries(parsed)) {
    const numeric = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(numeric) && numeric > 0) {
      shares[key] = numeric
    }
  }

  return Object.keys(shares).length > 0 ? shares : null
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
