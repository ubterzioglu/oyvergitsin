import { describe, expect, it } from 'vitest'
import { parseTgsJournalists } from './tgs-journalists'

describe('parseTgsJournalists', () => {
  it('parses numbered journalist rows from pipe output', () => {
    const rows = parseTgsJournalists(`
| ADI-SOYADI | KURUMU | GÖREVİ |
1 | Ali Çağatay | Ekotürk Tv | Gazeteci
2 | Elif Bayburt | ETHA | Muhabir
`)

    expect(rows).toEqual([
      {
        fullName: 'Ali Çağatay',
        outlet: 'Ekotürk Tv',
        jobTitle: 'Gazeteci',
        status: 'imprisoned',
        statusLabel: 'Cezaevinde',
      },
      {
        fullName: 'Elif Bayburt',
        outlet: 'ETHA',
        jobTitle: 'Muhabir',
        status: 'imprisoned',
        statusLabel: 'Cezaevinde',
      },
    ])
  })

  it('parses HTML table rows', () => {
    const rows = parseTgsJournalists(`
<table>
  <tr><th></th><th>ADI-SOYADI</th><th>KURUMU</th><th>GÖREVİ</th></tr>
  <tr><td>1</td><td>Nadiye Gürbüz</td><td>ETHA</td><td>Gazeteci</td></tr>
</table>
`)

    expect(rows[0]).toMatchObject({
      fullName: 'Nadiye Gürbüz',
      outlet: 'ETHA',
      jobTitle: 'Gazeteci',
      status: 'imprisoned',
    })
  })
})
