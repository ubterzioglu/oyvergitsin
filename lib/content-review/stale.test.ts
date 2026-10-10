import { describe, expect, it } from 'vitest'
import { daysSince, isPartyStale, isPositionStale, sortByStaleness } from './stale'

const NOW = new Date('2026-10-10T12:00:00Z')

describe('isPositionStale', () => {
  it('180 günü geçmeyen pozisyon taze sayılır', () => {
    expect(isPositionStale('2026-05-01T00:00:00Z', NOW)).toBe(false)
  })

  it('180 günden eski pozisyon eskimiştir', () => {
    expect(isPositionStale('2026-03-01T00:00:00Z', NOW)).toBe(true)
  })

  it('tarihsiz ya da bozuk tarihli pozisyon eskimiş sayılır', () => {
    expect(isPositionStale(null, NOW)).toBe(true)
    expect(isPositionStale('tarih-degil', NOW)).toBe(true)
  })
})

describe('isPartyStale', () => {
  it('parti kayıtları için 90 günlük eşik kullanılır', () => {
    expect(isPartyStale('2026-08-01T00:00:00Z', NOW)).toBe(false)
    expect(isPartyStale('2026-06-01T00:00:00Z', NOW)).toBe(true)
  })
})

describe('sortByStaleness', () => {
  it('tarihsizler başta, sonra en eskiden yeniye sıralar ve girdiyi değiştirmez', () => {
    const items = [
      { id: 'yeni', at: '2026-09-01T00:00:00Z' },
      { id: 'tarihsiz', at: null },
      { id: 'eski', at: '2026-01-01T00:00:00Z' },
    ]
    const sorted = sortByStaleness(items, (item) => item.at)
    expect(sorted.map((item) => item.id)).toEqual(['tarihsiz', 'eski', 'yeni'])
    expect(items[0].id).toBe('yeni')
  })
})

describe('daysSince', () => {
  it('tam gün sayısını döner, tarih yoksa null', () => {
    expect(daysSince('2026-10-01T12:00:00Z', NOW)).toBe(9)
    expect(daysSince(null, NOW)).toBeNull()
  })
})
