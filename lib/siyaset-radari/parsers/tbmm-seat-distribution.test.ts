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

  it('decodes hexadecimal and decimal numeric entities from real TBMM markup', () => {
    const rows = parseTbmmSeatDistribution(`
<table>
  <tr><th>Parti Ad&#x131;</th><th>&#xDC;ye Say&#x131;s&#x131;</th></tr>
  <tr><td>ADALET VE KALKINMA PART&#x130;S&#x130;</td><td>280</td></tr>
  <tr><td>CUMHUR&#x130;YET HALK PART&#x130;S&#x130;</td><td>135</td></tr>
  <tr><td>&#x130;Y&#x130; PART&#x130;</td><td>29</td></tr>
  <tr><td>HALKLARIN E&#x15E;&#x130;TL&#x130;K VE DEMOKRAS&#x130; PART&#x130;S&#x130;</td><td>56</td></tr>
  <tr><td>M&#x130;LL&#x130;YET&#xC7;&#x130; HAREKET PART&#x130;S&#x130;</td><td>47</td></tr>
  <tr><td>DEMOKRAS&#x130; VE ATILIM PART&#x130;S&#x130;</td><td>&#50;</td></tr>
  <tr><td>H&#xDC;DA PAR</td><td>4</td></tr>
  <tr><td>Toplam</td><td>592</td></tr>
</table>
`)

    expect(rows).toEqual([
      { partyName: 'ADALET VE KALKINMA PARTİSİ', seatCount: 280 },
      { partyName: 'CUMHURİYET HALK PARTİSİ', seatCount: 135 },
      { partyName: 'İYİ PARTİ', seatCount: 29 },
      { partyName: 'HALKLARIN EŞİTLİK VE DEMOKRASİ PARTİSİ', seatCount: 56 },
      { partyName: 'MİLLİYETÇİ HAREKET PARTİSİ', seatCount: 47 },
      { partyName: 'DEMOKRASİ VE ATILIM PARTİSİ', seatCount: 2 },
      { partyName: 'HÜDA PAR', seatCount: 4 },
    ])
    for (const row of rows) {
      expect(row.partyName).not.toMatch(/&#x?[0-9a-fA-F]+;/)
      expect(row.partyName).not.toMatch(/&[a-zA-Z]+;/)
    }
  })

  it('decodes decimal and remaining Turkish hexadecimal entities', () => {
    const rows = parseTbmmSeatDistribution('<table><tr><td>&#231;orum &#x11E;&#xD6;REVLER&#x130;</td><td>1</td></tr></table>')
    expect(rows).toEqual([{ partyName: 'çorum ĞÖREVLERİ', seatCount: 1 }])
  })

  it('ignores the 6-column gender distribution table entirely', () => {
    const rows = parseTbmmSeatDistribution(`
<table>
  <tr><th>Parti Adı</th><th>Kadın</th><th>%</th><th>Erkek</th><th>%</th><th>Toplam</th></tr>
  <tr><td>ADALET VE KALKINMA PART&#x130;S&#x130;</td><td>52</td><td>% 18,57</td><td>228</td><td>% 81,43</td><td>280</td></tr>
  <tr><td>CUMHUR&#x130;YET HALK PART&#x130;S&#x130;</td><td>30</td><td>% 22,22</td><td>105</td><td>% 77,78</td><td>135</td></tr>
  <tr><td>Genel Toplam</td><td>118</td><td>% 19,93</td><td>474</td><td>% 80,07</td><td>592</td></tr>
</table>
`)

    expect(rows).toEqual([])
  })

  it('ignores 6-column pipe rows', () => {
    const rows = parseTbmmSeatDistribution(`
Parti Adı | Kadın | % | Erkek | % | Toplam
--- | --- | --- | --- | --- | ---
ADALET VE KALKINMA PARTİSİ | 52 | % 18,57 | 228 | % 81,43 | 280
Genel Toplam | 118 | % 19,93 | 474 | % 80,07 | 592
`)

    expect(rows).toEqual([])
  })
})
