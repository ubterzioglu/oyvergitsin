import { isPartyStale, isPositionStale, sortByStaleness } from './stale'

export interface AdminParty {
  id: string
  name: string
  shortName: string | null
  color: string
  isActive: boolean
  matchStatus: string | null
  registryStatus: string | null
  registryCheckedAt: string | null
}

export interface AdminAxis {
  id: string
  name: string
  slug: string
  orderIndex: number
}

export interface AdminPosition {
  id: string
  partyId: string
  axisId: string
  score: number
  updatedAt: string | null
  lastVerifiedAt: string | null
}

export interface PositionMatrix {
  axisModelId: string | null
  parties: AdminParty[]
  axes: AdminAxis[]
  positions: AdminPosition[]
}

export interface StalePositionItem {
  position: AdminPosition
  party: AdminParty
  axis: AdminAxis
}

export interface ReviewQueue {
  positions: StalePositionItem[]
  parties: AdminParty[]
}

/** "Gözden geçirilecekler": doğrulaması eskimiş pozisyonlar ve parti kayıtları. */
export function buildReviewQueue(matrix: PositionMatrix, now = new Date()): ReviewQueue {
  const partyById = new Map(matrix.parties.map((party) => [party.id, party]))
  const axisById = new Map(matrix.axes.map((axis) => [axis.id, axis]))

  const stalePositions = matrix.positions.flatMap((position): StalePositionItem[] => {
    const party = partyById.get(position.partyId)
    const axis = axisById.get(position.axisId)
    if (!party || !axis || !party.isActive || !isPositionStale(position.lastVerifiedAt, now)) {
      return []
    }
    return [{ position, party, axis }]
  })

  const staleParties = matrix.parties.filter(
    (party) => party.isActive && party.matchStatus === 'eligible' && isPartyStale(party.registryCheckedAt, now)
  )

  return {
    positions: sortByStaleness(stalePositions, (item) => item.position.lastVerifiedAt),
    parties: sortByStaleness(staleParties, (party) => party.registryCheckedAt),
  }
}
