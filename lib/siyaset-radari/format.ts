export function formatRadarDate(value: string | null): string {
  if (!value) {
    return 'Tarih yok'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Tarih yok'
  }
  return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function xSearchUrl(name: string): string {
  return `https://x.com/search?q=${encodeURIComponent(`"${name}"`)}&src=typed_query&f=live`
}
