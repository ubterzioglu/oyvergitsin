import { afterEach, describe, expect, it, vi } from 'vitest'

const { assertSafeTestTarget, isLocalTarget } = require('./test-write-guard')

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('test write guard', () => {
  it('allows localhost targets by default', () => {
    expect(() => assertSafeTestTarget('http://localhost:3000')).not.toThrow()
    expect(() => assertSafeTestTarget('http://127.0.0.1:3000')).not.toThrow()
  })

  it('blocks remote targets unless explicitly allowed', () => {
    expect(() => assertSafeTestTarget('https://oyvergitsin.org')).toThrow('Refusing to run')
  })

  it('allows remote targets with explicit opt in', () => {
    vi.stubEnv('ALLOW_REMOTE_TEST_WRITES', 'true')

    expect(() => assertSafeTestTarget('https://example.test')).not.toThrow()
  })

  it('classifies remote hosts as non-local', () => {
    expect(isLocalTarget('https://oyvergitsin.org')).toBe(false)
  })
})
