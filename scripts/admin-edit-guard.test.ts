import { describe, expect, it } from 'vitest'
import guard from './lib/admin-edit-guard.js'

const { decideAdminEditGuard, FORCE_FLAG } = guard

describe('decideAdminEditGuard', () => {
  it('panel düzenlemesi yoksa sessizce devam eder', () => {
    expect(decideAdminEditGuard({ adminEditCount: 0, force: false })).toEqual({
      proceed: true,
      logSeed: false,
      message: null,
    })
  })

  it('panel düzenlemesi varken bayraksız durur ve bayrağı söyler', () => {
    const decision = decideAdminEditGuard({ adminEditCount: 3, force: false })
    expect(decision.proceed).toBe(false)
    expect(decision.message).toContain(FORCE_FLAG)
  })

  it('bayrakla devam eder ama günlüğe yazılmasını ister', () => {
    const decision = decideAdminEditGuard({ adminEditCount: 3, force: true })
    expect(decision.proceed).toBe(true)
    expect(decision.logSeed).toBe(true)
  })
})
