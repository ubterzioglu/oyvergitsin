import { createHash } from 'crypto'

/**
 * Hashing and title-normalization helpers for candidate deduplication.
 */

function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // strip punctuation, keep letters/numbers
    .replace(/\s+/g, ' ')
    .trim()
}

export async function buildCanonicalUrlHash(canonicalUrl: string): Promise<string> {
  return sha256Hex(canonicalUrl)
}

export async function buildContentHash(
  normalizedTitle: string,
  sourceName: string,
  publishedAt?: string | null
): Promise<string> {
  const parts = [normalizedTitle, sourceName.toLowerCase().trim(), publishedAt ?? '']
  return sha256Hex(parts.join('|'))
}
