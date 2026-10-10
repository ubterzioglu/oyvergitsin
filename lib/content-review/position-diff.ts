export interface EvidenceItem {
  source_type: string
  source_title: string
  source_url: string | null
  source_date: string | null
  quote: string | null
  rationale: string
}

export interface PositionState {
  score: number | null
  evidence: readonly EvidenceItem[]
}

export interface PositionDiff {
  scoreChanged: boolean
  delta: number | null
  evidenceAdded: EvidenceItem[]
  evidenceRemoved: EvidenceItem[]
  hasChanges: boolean
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim()
}

// Kanıtın kimliği içeriğidir: aynı alanlara sahip iki kanıt "aynı" sayılır.
function evidenceKey(item: EvidenceItem): string {
  return JSON.stringify([
    normalize(item.source_type),
    normalize(item.source_title),
    normalize(item.source_url),
    normalize(item.source_date),
    normalize(item.quote),
    normalize(item.rationale),
  ])
}

/** Yayın önizlemesi: eski ve yeni pozisyon arasındaki farkı çıkarır. */
export function diffPosition(previous: PositionState, next: PositionState): PositionDiff {
  const previousKeys = new Set(previous.evidence.map(evidenceKey))
  const nextKeys = new Set(next.evidence.map(evidenceKey))

  const evidenceAdded = next.evidence.filter((item) => !previousKeys.has(evidenceKey(item)))
  const evidenceRemoved = previous.evidence.filter((item) => !nextKeys.has(evidenceKey(item)))
  const scoreChanged = previous.score !== next.score
  const delta = previous.score === null || next.score === null ? null : next.score - previous.score

  return {
    scoreChanged,
    delta,
    evidenceAdded,
    evidenceRemoved,
    hasChanges: scoreChanged || evidenceAdded.length > 0 || evidenceRemoved.length > 0,
  }
}
