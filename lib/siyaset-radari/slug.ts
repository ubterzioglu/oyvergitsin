const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: 'c',
  Ç: 'c',
  ğ: 'g',
  Ğ: 'g',
  ı: 'i',
  I: 'i',
  İ: 'i',
  ö: 'o',
  Ö: 'o',
  ş: 's',
  Ş: 's',
  ü: 'u',
  Ü: 'u',
}

export function slugifyName(value: string): string {
  const ascii = value
    .split('')
    .map((char) => TURKISH_CHAR_MAP[char] ?? char)
    .join('')

  return ascii
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function normalizeName(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}
