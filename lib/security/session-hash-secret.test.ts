import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSessionHashSecret } from './session-hash-secret'

const originalSessionHashSecret = process.env.SESSION_HASH_SECRET

afterEach(() => {
  vi.unstubAllEnvs()
  if (originalSessionHashSecret === undefined) {
    delete process.env.SESSION_HASH_SECRET
  } else {
    process.env.SESSION_HASH_SECRET = originalSessionHashSecret
  }
})

describe('getSessionHashSecret', () => {
  it('returns SESSION_HASH_SECRET when configured', () => {
    vi.stubEnv('SESSION_HASH_SECRET', 'configured-secret')
    vi.stubEnv('NODE_ENV', 'production')

    expect(getSessionHashSecret()).toBe('configured-secret')
  })

  it('uses an explicit development-only fallback outside production', () => {
    vi.stubEnv('SESSION_HASH_SECRET', '')
    vi.stubEnv('NODE_ENV', 'test')

    expect(getSessionHashSecret()).toBe('development-only-session-hash-secret')
  })

  it('fails closed in production when SESSION_HASH_SECRET is missing', () => {
    vi.stubEnv('SESSION_HASH_SECRET', '')
    vi.stubEnv('NODE_ENV', 'production')

    expect(() => getSessionHashSecret()).toThrow('SESSION_HASH_SECRET is required in production')
  })
})
