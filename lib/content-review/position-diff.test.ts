import { describe, expect, it } from 'vitest'
import { diffPosition, type EvidenceItem } from './position-diff'

const evidence = (title: string, rationale = 'Parti programının ilgili maddesi.'): EvidenceItem => ({
  source_type: 'parti_programi',
  source_title: title,
  source_url: 'https://example.org/program',
  source_date: '2026-01-01',
  quote: null,
  rationale,
})

describe('diffPosition', () => {
  it('aynı skor ve kanıtta değişiklik yoktur', () => {
    const state = { score: 20, evidence: [evidence('Program')] }
    const diff = diffPosition(state, { score: 20, evidence: [evidence('Program')] })
    expect(diff.hasChanges).toBe(false)
    expect(diff.delta).toBe(0)
  })

  it('skor değişimini ve farkını raporlar', () => {
    const diff = diffPosition({ score: 20, evidence: [] }, { score: -10, evidence: [] })
    expect(diff.scoreChanged).toBe(true)
    expect(diff.delta).toBe(-30)
    expect(diff.hasChanges).toBe(true)
  })

  it('eklenen ve çıkarılan kanıtları ayırır; boşluk farkını değişiklik saymaz', () => {
    const diff = diffPosition(
      { score: 5, evidence: [evidence('Eski'), evidence('Ortak')] },
      { score: 5, evidence: [evidence(' Ortak '), evidence('Yeni')] }
    )
    expect(diff.evidenceAdded.map((item) => item.source_title)).toEqual(['Yeni'])
    expect(diff.evidenceRemoved.map((item) => item.source_title)).toEqual(['Eski'])
    expect(diff.scoreChanged).toBe(false)
  })

  it('yeni pozisyonda (önceki skor yok) delta null olur', () => {
    const diff = diffPosition({ score: null, evidence: [] }, { score: 40, evidence: [evidence('X')] })
    expect(diff.delta).toBeNull()
    expect(diff.hasChanges).toBe(true)
  })
})
