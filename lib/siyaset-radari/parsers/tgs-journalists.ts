import type { ParsedJournalistStatus } from '../types'
import { normalizeName } from '../slug'

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

function isLikelyHeader(cells: string[]): boolean {
  return cells.some((cell) => /ADI-?SOYADI|KURUMU|GÖREVİ|GOREVI/i.test(cell))
}

function rowToJournalist(cells: string[]): ParsedJournalistStatus | null {
  const normalized = cells.map(stripTags).filter(Boolean)
  if (normalized.length < 3 || isLikelyHeader(normalized)) {
    return null
  }

  const [, name, outlet, jobTitle] = normalized.length >= 4 ? normalized : ['', normalized[0], normalized[1], normalized[2]]
  const fullName = normalizeName(name)
  if (!fullName || /^\d+$/.test(fullName)) {
    return null
  }

  return {
    fullName,
    outlet: outlet || null,
    jobTitle: jobTitle || null,
    status: 'imprisoned',
    statusLabel: 'Cezaevinde',
  }
}

function parseHtmlTableRows(content: string): ParsedJournalistStatus[] {
  return [...content.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((rowMatch) => [...rowMatch[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => stripTags(cell[1])))
    .map(rowToJournalist)
    .filter((item): item is ParsedJournalistStatus => item !== null)
}

function parsePipeRows(content: string): ParsedJournalistStatus[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes('|') && !line.includes('---'))
    .map((line) => line.split('|').map((cell) => cell.trim()).filter(Boolean))
    .map(rowToJournalist)
    .filter((item): item is ParsedJournalistStatus => item !== null)
}

export function parseTgsJournalists(content: string): ParsedJournalistStatus[] {
  const htmlRows = parseHtmlTableRows(content)
  if (htmlRows.length > 0) {
    return htmlRows
  }
  return parsePipeRows(content)
}
