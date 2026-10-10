import { describe, expect, it } from 'vitest'
import { buildReviewQueue, type AdminParty, type PositionMatrix } from './review-queue'

const NOW = new Date('2026-10-10T00:00:00Z')

const party = (id: string, overrides: Partial<AdminParty> = {}): AdminParty => ({
  id,
  name: id.toUpperCase(),
  shortName: null,
  color: '#000000',
  isActive: true,
  matchStatus: 'eligible',
  registryStatus: 'active',
  registryCheckedAt: '2026-10-01T00:00:00Z',
  ...overrides,
})

const matrix: PositionMatrix = {
  axisModelId: 'model',
  parties: [
    party('akt'),
    party('kapali', { isActive: false, registryCheckedAt: null }),
    party('eski', { registryCheckedAt: '2026-01-01T00:00:00Z' }),
    party('katalog', { matchStatus: 'catalog_only', registryCheckedAt: null }),
  ],
  axes: [{ id: 'ax', name: 'Ekonomi', slug: 'ekonomi', orderIndex: 1 }],
  positions: [
    { id: 'p1', partyId: 'akt', axisId: 'ax', score: 10, updatedAt: null, lastVerifiedAt: '2026-09-01T00:00:00Z' },
    { id: 'p2', partyId: 'eski', axisId: 'ax', score: 10, updatedAt: null, lastVerifiedAt: '2025-12-01T00:00:00Z' },
    { id: 'p3', partyId: 'kapali', axisId: 'ax', score: 10, updatedAt: null, lastVerifiedAt: null },
    { id: 'p4', partyId: 'akt', axisId: 'baska-model', score: 10, updatedAt: null, lastVerifiedAt: null },
    { id: 'p5', partyId: 'katalog', axisId: 'ax', score: 10, updatedAt: null, lastVerifiedAt: '2025-01-01T00:00:00Z' },
  ],
}

describe('buildReviewQueue', () => {
  it('yalnız aktif partilerin, aktif eksendeki eskimiş pozisyonlarını en eskisi başta listeler', () => {
    const queue = buildReviewQueue(matrix, NOW)
    expect(queue.positions.map((item) => item.position.id)).toEqual(['p5', 'p2'])
  })

  it('yalnız eşleşmeye giren (eligible) ve kontrolü eskimiş aktif partileri listeler', () => {
    const queue = buildReviewQueue(matrix, NOW)
    expect(queue.parties.map((item) => item.id)).toEqual(['eski'])
  })
})
