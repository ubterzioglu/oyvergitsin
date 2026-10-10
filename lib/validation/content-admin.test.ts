import { describe, expect, it } from 'vitest'
import { EvidenceItemSchema, PublishPositionSchema } from './content-admin'

const validEvidence = {
  source_type: 'parti_programi',
  source_title: 'Parti Programı 2024',
  source_url: 'https://example.org/program.pdf',
  source_date: '2024-05-01',
  quote: '',
  rationale: 'Programın ekonomi bölümü devletçi bir çizgiyi açıkça savunuyor.',
}

const validPublish = {
  partyId: '7c1f5c6e-6d7e-4f43-9a51-2f8b8d9f0a11',
  axisId: '2a9b6e3c-1f4d-4c8e-9b7a-5d3e2f1a0b22',
  expectedUpdatedAt: '2026-07-20T10:00:00.123456+00:00',
  score: 35,
  evidence: [validEvidence],
}

describe('EvidenceItemSchema', () => {
  it('geçerli kanıtı kabul eder ve boş alıntıyı null yapar', () => {
    const parsed = EvidenceItemSchema.parse(validEvidence)
    expect(parsed.quote).toBeNull()
  })

  it('https olmayan bağlantıyı reddeder', () => {
    expect(EvidenceItemSchema.safeParse({ ...validEvidence, source_url: 'http://example.org' }).success).toBe(false)
  })

  it('takvimde olmayan tarihi reddeder', () => {
    expect(EvidenceItemSchema.safeParse({ ...validEvidence, source_date: '2026-02-31' }).success).toBe(false)
  })

  it('ileri tarihli kaynağı reddeder', () => {
    expect(EvidenceItemSchema.safeParse({ ...validEvidence, source_date: '2999-01-01' }).success).toBe(false)
  })

  it('kısa gerekçeyi ve bilinmeyen kaynak türünü reddeder', () => {
    expect(EvidenceItemSchema.safeParse({ ...validEvidence, rationale: 'kısa' }).success).toBe(false)
    expect(EvidenceItemSchema.safeParse({ ...validEvidence, source_type: 'tweet' }).success).toBe(false)
  })

  it('bağlantı ve tarih olmadan da kabul eder', () => {
    const parsed = EvidenceItemSchema.parse({ ...validEvidence, source_url: null, source_date: null })
    expect(parsed.source_url).toBeNull()
    expect(parsed.source_date).toBeNull()
  })
})

describe('PublishPositionSchema', () => {
  it('geçerli yayını kabul eder, isPublic varsayılan true', () => {
    expect(PublishPositionSchema.parse(validPublish).isPublic).toBe(true)
  })

  it('boş kanıt listesini reddeder', () => {
    expect(PublishPositionSchema.safeParse({ ...validPublish, evidence: [] }).success).toBe(false)
  })

  it('puan sınırlarını ve tam sayıyı zorunlu tutar', () => {
    expect(PublishPositionSchema.safeParse({ ...validPublish, score: 101 }).success).toBe(false)
    expect(PublishPositionSchema.safeParse({ ...validPublish, score: -100 }).success).toBe(true)
    expect(PublishPositionSchema.safeParse({ ...validPublish, score: 1.5 }).success).toBe(false)
  })

  it('yeni pozisyon için expectedUpdatedAt null olabilir', () => {
    expect(PublishPositionSchema.safeParse({ ...validPublish, expectedUpdatedAt: null }).success).toBe(true)
  })
})
