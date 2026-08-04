import type { ParsedSeatDistribution } from '../types'

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function parseNumber(value: string): number | null {
  const normalized = value.replace(/[^\d]/g, '')
  if (!normalized) {
    return null
  }
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function parsePipeRows(content: string): ParsedSeatDistribution[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes('|') && !line.includes('---'))
    .map((line) => line.split('|').map((cell) => cell.trim()).filter(Boolean))
    .filter((cells) => cells.length >= 2)
    .map(([partyName, seatValue]) => ({ partyName: stripTags(partyName), seatCount: parseNumber(seatValue) }))
    .filter((row): row is ParsedSeatDistribution => Boolean(row.partyName) && row.seatCount !== null)
    .filter((row) => row.partyName !== 'Parti Adı' && row.partyName !== 'Toplam')
}

function parseHtmlRows(content: string): ParsedSeatDistribution[] {
  const rows = [...content.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
  return rows
    .map((rowMatch) => [...rowMatch[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => stripTags(cell[1])))
    .filter((cells) => cells.length >= 2)
    .map(([partyName, seatValue]) => ({ partyName, seatCount: parseNumber(seatValue) }))
    .filter((row): row is ParsedSeatDistribution => Boolean(row.partyName) && row.seatCount !== null)
    .filter((row) => row.partyName !== 'Parti Adı' && row.partyName !== 'Toplam' && row.partyName !== 'Genel Toplam')
}

export function parseTbmmSeatDistribution(content: string): ParsedSeatDistribution[] {
  const htmlRows = parseHtmlRows(content)
  if (htmlRows.length > 0) {
    return htmlRows
  }
  return parsePipeRows(content)
}
