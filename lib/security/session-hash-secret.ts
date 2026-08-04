const DEV_SESSION_HASH_SECRET = 'development-only-session-hash-secret'

export function hasSessionHashSecret(): boolean {
  return Boolean(process.env.SESSION_HASH_SECRET?.trim())
}

export function getSessionHashSecret(): string {
  const secret = process.env.SESSION_HASH_SECRET?.trim()

  if (secret) {
    return secret
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_HASH_SECRET is required in production')
  }

  return DEV_SESSION_HASH_SECRET
}
