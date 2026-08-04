import { describe, expect, it } from 'vitest'
import { parseYskElectionResults } from './ysk-election-results'

describe('parseYskElectionResults', () => {
  it('normalizes mixed YSK-style rows', () => {
    const rows = parseYskElectionResults([
      {
        Yıl: '2023',
        'Seçim Türü': 'milletvekili_genel',
        İl: 'Ankara',
        'Siyasi Parti': 'CHP',
        Oy: '1.234.567',
        Oran: '32,45',
        'M.Vekili': '13',
      },
    ])

    expect(rows).toEqual([
      {
        electionYear: 2023,
        electionType: 'milletvekili_genel',
        areaLevel: 'province',
        areaName: 'Ankara',
        province: 'Ankara',
        electoralDistrict: null,
        partyName: 'CHP',
        voteCount: 1234567,
        voteShare: 32.45,
        seatCount: 13,
      },
    ])
  })
})
