const SUPABASE_SUFFIX = '.supabase.co'

export function getSupabaseConfigError(
  supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
): string | null {
  const normalizedUrl = supabaseUrl?.trim() || ''
  const normalizedAnonKey = supabaseAnonKey?.trim() || ''

  if (!normalizedUrl || normalizedUrl === 'your_supabase_url') {
    return 'NEXT_PUBLIC_SUPABASE_URL eksik. Supabase panelindeki Project URL degerini .env.local dosyasina ekleyin.'
  }

  if (!normalizedAnonKey || normalizedAnonKey === 'your_supabase_anon_key') {
    return 'NEXT_PUBLIC_SUPABASE_ANON_KEY eksik. Supabase panelindeki anon key degerini .env.local dosyasina ekleyin.'
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(normalizedUrl)
  } catch {
    return 'NEXT_PUBLIC_SUPABASE_URL gecersiz bir URL. Ornek format: https://<project-ref>.supabase.co'
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    return 'NEXT_PUBLIC_SUPABASE_URL sadece http veya https protokolu kullanabilir.'
  }

  const host = parsedUrl.hostname.toLowerCase()
  const isLocalHost = host === 'localhost' || host === '127.0.0.1'

  if (host.endsWith(SUPABASE_SUFFIX)) {
    const projectRef = host.slice(0, -SUPABASE_SUFFIX.length)
    if (!/^[a-z0-9]{20}$/.test(projectRef)) {
      return 'Supabase URL icindeki project ref beklenen formatta degil. Project URL degerini Supabase > Project Settings > API altindan tekrar kopyalayin.'
    }
  } else if (!isLocalHost) {
    // Self-hosted Supabase can use custom domains. We only validate obvious misconfiguration.
    return null
  }

  return null
}
