import { describe, expect, it } from 'vitest'
import { parseTbmmSeatDistribution } from './tbmm-seat-distribution'

describe('parseTbmmSeatDistribution', () => {
  it('parses TBMM pipe table output', () => {
    const rows = parseTbmmSeatDistribution(`
Parti Adı | Üye Sayısı
--- | ---
ADALET VE KALKINMA PARTİSİ | 277
CUMHURİYET HALK PARTİSİ | 45
Toplam | 592
`)

    expect(rows).toEqual([
      { partyName: 'ADALET VE KALKINMA PARTİSİ', seatCount: 277 },
      { partyName: 'CUMHURİYET HALK PARTİSİ', seatCount: 45 },
    ])
  })

  it('parses HTML table rows', () => {
    const rows = parseTbmmSeatDistribution(`
<table>
  <tr><th>Parti Adı</th><th>Üye Sayısı</th></tr>
  <tr><td>İYİ PARTİ</td><td>29</td></tr>
</table>
`)

    expect(rows).toEqual([{ partyName: 'İYİ PARTİ', seatCount: 29 }])
  })
})
