import type { ParsedElectionResult } from '../types'

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  const normalized = String(value).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
  if (!normalized) {
    return null
  }
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function getString(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return null
}

export function parseYskElectionResults(rows: Array<Record<string, unknown>>): ParsedElectionResult[] {
  return rows
    .map((row): ParsedElectionResult | null => {
      const partyName = getString(row, ['party_name', 'parti_adi', 'Parti Adı', 'Siyasi Parti', 'siyasi_parti'])
      const areaName = getString(row, ['area_name', 'il', 'İl', 'secim_cevresi', 'Seçim Çevresi'])
      const electionYear = toNumber(row.election_year ?? row.yil ?? row.Yıl)

      if (!partyName || !areaName || !electionYear) {
        return null
      }

      return {
        electionYear,
        electionType: getString(row, ['election_type', 'secim_turu', 'Seçim Türü']) ?? 'milletvekili_genel',
        areaLevel: (getString(row, ['area_level', 'alan_duzeyi']) as ParsedElectionResult['areaLevel'] | null) ?? 'province',
        areaName,
        province: getString(row, ['province', 'il', 'İl']),
        electoralDistrict: getString(row, ['electoral_district', 'secim_cevresi', 'Seçim Çevresi']),
        partyName,
        voteCount: toNumber(row.vote_count ?? row.oy_sayisi ?? row.Oy),
        voteShare: toNumber(row.vote_share ?? row.oy_orani ?? row.Oran),
        seatCount: toNumber(row.seat_count ?? row.milletvekili ?? row['M.Vekili']),
      } satisfies ParsedElectionResult
    })
    .filter((item): item is ParsedElectionResult => item !== null)
}
