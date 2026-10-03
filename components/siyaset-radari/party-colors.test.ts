import { describe, expect, it } from 'vitest'
import { PARTY_COLORS } from '@/lib/parties'
import { assignPartyColors, resolvePartyColor, toPartyShortName } from './party-colors'

/**
 * NOT: Bu test repo'nun varsayılan `npm test` koşusuna DAHİL DEĞİL —
 * vitest.config.ts yalnızca `lib/**` ve `scripts/**` kapsıyor ve o dosya
 * B13'ün sahipliğinde değil. B12–B18 bittiğinde include desenine
 * `components/**\/*.test.ts` eklenmeli.
 *
 * Geçici config ile koşuldu ve 13/13 geçti (bkz. commit mesajı).
 */

// TBMM sandalye dağılımı sayfasından alınan gerçek satırlar.
const TBMM_PARTIES = [
  'ADALET VE KALKINMA PARTİSİ',
  'YENİ PARTİ',
  'HALKLARIN EŞİTLİK VE DEMOKRASİ PARTİSİ',
  'MİLLİYETÇİ HAREKET PARTİSİ',
  'CUMHURİYET HALK PARTİSİ',
  'İYİ PARTİ',
  'YENİ YOL PARTİSİ',
  'BAĞIMSIZ MİLLETVEKİLİ',
  'HÜR DAVA PARTİSİ',
  'YENİDEN REFAH PARTİSİ',
  'TÜRKİYE İŞÇİ PARTİSİ',
  'DEMOKRATİK BÖLGELER PARTİSİ',
  'EMEK PARTİSİ',
  'SAADET PARTİSİ',
  'DEMOKRATİK SOL PARTİ',
  'DEMOKRAT PARTİ',
]

describe('resolvePartyColor', () => {
  it('TBMM büyük harfli resmî adı marka rengine çözer', () => {
    expect(resolvePartyColor('ADALET VE KALKINMA PARTİSİ')).toBe(PARTY_COLORS.AKP)
    expect(resolvePartyColor('CUMHURİYET HALK PARTİSİ')).toBe(PARTY_COLORS.CHP)
    expect(resolvePartyColor('MİLLİYETÇİ HAREKET PARTİSİ')).toBe(PARTY_COLORS.MHP)
  })

  it('kısa adı doğrudan çözer', () => {
    expect(resolvePartyColor('AKP')).toBe(PARTY_COLORS.AKP)
    expect(resolvePartyColor('YENİ PARTİ')).toBe(PARTY_COLORS['YENİ PARTİ'])
  })

  it('büyük/küçük harf ve noktalama farkını yok sayar', () => {
    expect(resolvePartyColor('Adalet ve Kalkınma Partisi')).toBe(PARTY_COLORS.AKP)
    expect(resolvePartyColor('  adalet  ve  kalkınma  partisi ')).toBe(PARTY_COLORS.AKP)
  })

  it('İYİ Parti Türkçe büyük İ ile de çözülür', () => {
    expect(resolvePartyColor('İYİ PARTİ')).toBe(PARTY_COLORS['İYİ'])
    expect(resolvePartyColor('İYİ')).toBe(PARTY_COLORS['İYİ'])
  })

  it('DEM, YSP kaydının rengini alır', () => {
    expect(resolvePartyColor('HALKLARIN EŞİTLİK VE DEMOKRASİ PARTİSİ')).toBe(PARTY_COLORS.YSP)
    expect(resolvePartyColor('DEM PARTİ')).toBe(PARTY_COLORS.YSP)
  })

  it('marka rengi olmayan parti için null döner', () => {
    expect(resolvePartyColor('BAĞIMSIZ MİLLETVEKİLİ')).toBeNull()
    expect(resolvePartyColor('YENİ YOL PARTİSİ')).toBeNull()
  })
})

describe('assignPartyColors', () => {
  it('her partiye renk verir, hiçbiri boş kalmaz', () => {
    const colors = assignPartyColors(TBMM_PARTIES)
    expect(colors).toHaveLength(TBMM_PARTIES.length)
    expect(colors.every((color) => /^#[0-9A-Fa-f]{6}$/.test(color))).toBe(true)
  })

  it('marka rengi olanlara kendi rengini verir', () => {
    const colors = assignPartyColors(TBMM_PARTIES)
    expect(colors[0]).toBe(PARTY_COLORS.AKP)
    expect(colors[1]).toBe(PARTY_COLORS['YENİ PARTİ'])
    expect(colors[4]).toBe(PARTY_COLORS.CHP)
  })

  it('aynı giriş aynı çıktıyı verir — sıra bağımlı rastgelelik yok', () => {
    expect(assignPartyColors(TBMM_PARTIES)).toEqual(assignPartyColors(TBMM_PARTIES))
  })

  it('bir partinin dilimi başka bir partinin markasıyla boyanmaz', () => {
    const colors = assignPartyColors(TBMM_PARTIES)
    const brandColors = new Set(Object.values(PARTY_COLORS))

    TBMM_PARTIES.forEach((name, index) => {
      const assigned = colors[index]
      if (!brandColors.has(assigned)) {
        return
      }
      // Marka rengi atandıysa, o renk GERÇEKTEN bu partinin rengi olmalı.
      expect(assigned).toBe(resolvePartyColor(name))
    })
  })
})

describe('toPartyShortName', () => {
  it('uzun resmî adı kısaltır', () => {
    expect(toPartyShortName('ADALET VE KALKINMA PARTİSİ')).toBe('AKP')
    expect(toPartyShortName('TÜRKİYE İŞÇİ PARTİSİ')).toBe('TİP')
  })

  it('HEDEP için güncel kısa adı verir', () => {
    expect(toPartyShortName('HALKLARIN EŞİTLİK VE DEMOKRASİ PARTİSİ')).toBe('DEM')
  })

  it('karşılığı yoksa adı olduğu gibi bırakır', () => {
    expect(toPartyShortName('BAĞIMSIZ MİLLETVEKİLİ')).toBe('BAĞIMSIZ MİLLETVEKİLİ')
  })
})
