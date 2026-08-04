import { describe, expect, it } from 'vitest'
import { isJournalistStatusStale, isParliamentSnapshotStale } from './stale'

describe('stale checks', () => {
  const now = new Date('2026-08-04T12:00:00.000Z')

  it('marks journalist statuses stale after 30 days', () => {
    expect(isJournalistStatusStale('2026-07-05T12:00:00.000Z', now)).toBe(false)
    expect(isJournalistStatusStale('2026-07-04T11:59:59.000Z', now)).toBe(true)
  })

  it('marks parliament snapshots stale after 7 days', () => {
    expect(isParliamentSnapshotStale('2026-07-28T12:00:00.000Z', now)).toBe(false)
    expect(isParliamentSnapshotStale('2026-07-28T11:59:59.000Z', now)).toBe(true)
  })
})
