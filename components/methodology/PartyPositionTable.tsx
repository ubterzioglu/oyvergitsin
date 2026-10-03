import { getPublicServerClient } from '@/lib/supabase/route'
import { getPartyColor } from '@/lib/parties'
import { Card } from '@/components/ui/Card'

interface AxisRef {
  id: string
  name: string
  slug: string
}

interface PartyPositionTableProps {
  axes: AxisRef[]
  className?: string
}

interface PositionRow {
  party_id: string
  axis_id: string
  score: number
  parties: { name: string; short_name: string | null } | null
  party_position_evidence: Array<{ source_type: string; rationale: string }> | null
}

/**
 * Sayfa build sırasında prerender edildiği için veritabanı hatası tüm build'i
 * düşürmemeli; boş liste dönüp "henüz konum kodlanmadı" mesajı gösterilir.
 */
async function loadPositions(axisIds: string[]): Promise<PositionRow[]> {
  try {
    const supabase = getPublicServerClient()
    const { data, error } = await supabase
      .from('party_positions')
      .select(
        'party_id, axis_id, score, parties(name, short_name), party_position_evidence(source_type, rationale)'
      )
      .in('axis_id', axisIds)

    if (error) throw error

    return (data ?? []) as unknown as PositionRow[]
  } catch (error) {
    console.error('Parti konumları alınamadı:', error)
    return []
  }
}

/**
 * Parti rengi noktası — renk burada PARTİ VERİSİDİR, kabuk dekorasyonu değil.
 * Bu yüzden lib/parties.ts'teki PARTY_COLORS'tan gelir (dosya değiştirilmeden).
 *
 * NEDEN NOKTA, NEDEN METİN YOK: parti renklerinin üzerine sabit beyaz metin
 * okunmuyor (AKP #F7941D beyazla 2.28, MHP #F2B705 1.82, Memleket #FDD007
 * 1.48 — hepsi 3:1'in altında). Ön planı zemine göre seçmek de kurtarmıyor:
 * Zafer #00964C için en iyi seçenek bile 4.46 (beyaz 3.84 / ink 4.44), yani
 * AA'nın (4.5) altında. Bu yüzden parti rengi yalnızca aria-hidden nokta
 * olarak taşınır; parti adı her zaman ink-primary metindir (kartta 17.13) ve
 * renk bilgisini metin de taşıdığı için nokta dekoratiftir, kontrast borcu
 * doğurmaz.
 */
function PartySwatch({ shortName }: { shortName: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-3 shrink-0 rounded-badge"
      style={{ backgroundColor: getPartyColor(shortName) }}
    />
  )
}

/**
 * Parti-eksen konum matrisi ve her hücrenin kanıt tipi.
 *
 * Metodoloji raporu §6, her parti-madde konumu için tarihli kaynak ve kodlama
 * gerekçesinin yayımlanmasını şart koşuyor. "Türetilmiş" hücreler doğrudan
 * kaynak kodlaması değildir ve burada ayrı işaretlenir.
 */
export async function PartyPositionTable({ axes, className = '' }: PartyPositionTableProps) {
  const axisIds = axes.map((axis) => axis.id)

  if (axisIds.length === 0) return null

  const positions = await loadPositions(axisIds)

  if (positions.length === 0) {
    return (
      <Card elevated className={className}>
        <h2 className="mb-2 font-heading text-2xl font-semibold text-ink-primary">Parti konumları</h2>
        <p className="text-sm text-ink-secondary">Bu eksen modeli için henüz konum kodlanmadı.</p>
      </Card>
    )
  }

  const byParty = new Map<string, { name: string; shortName: string; scores: Map<string, PositionRow> }>()

  for (const position of positions) {
    const party = byParty.get(position.party_id) ?? {
      name: position.parties?.name ?? '—',
      shortName: position.parties?.short_name ?? '—',
      scores: new Map<string, PositionRow>(),
    }
    party.scores.set(position.axis_id, position)
    byParty.set(position.party_id, party)
  }

  const derivedCount = positions.filter((position) =>
    position.party_position_evidence?.some((evidence) => evidence.source_type === 'turetilmis')
  ).length

  return (
    <Card elevated className={className}>
      <h2 className="mb-2 font-heading text-2xl font-semibold text-ink-primary">Parti konumları</h2>
      <p className="mb-4 max-w-prose text-base leading-relaxed text-ink-secondary">
        Her hücre partinin o eksendeki konumudur (−100 ile +100 arası). Konumlar yayımlanmış parti
        programları ve seçim beyannamelerine dayanır. Renk noktaları partilerin kurumsal
        renkleridir.
      </p>

      {derivedCount > 0 && (
        <p className="mb-4 max-w-prose rounded-card border-l-4 border-l-accent bg-accent-tint px-4 py-3 text-sm leading-relaxed text-ink-primary">
          <span className="data-figure font-semibold">{derivedCount}</span> konum, önceki eksen
          modelindeki kodlamalardan kurallı dönüşümle türetilmiştir — doğrudan kaynak kodlaması
          değildir. Dönüşüm kuralları ve gerekçeleri
          <code className="mx-1 rounded-badge border border-border-strong bg-surface-muted px-1 text-xs">
            docs/party-positions-v2-derivation.md
          </code>
          dosyasında kayıtlıdır.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border-strong">
              <th scope="col" className="py-2 pr-3 text-left font-semibold text-ink-primary">
                Parti
              </th>
              {axes.map((axis) => (
                <th
                  key={axis.id}
                  scope="col"
                  className="px-2 py-2 text-right font-medium text-ink-secondary"
                  title={axis.name}
                >
                  {axis.slug}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...byParty.entries()].map(([partyId, party]) => (
              <tr key={partyId} className="border-b border-border">
                <th scope="row" className="py-2 pr-3 text-left font-normal">
                  <span className="flex items-center gap-2">
                    <PartySwatch shortName={party.shortName} />
                    <span className="text-ink-primary">{party.name}</span>
                  </span>
                </th>
                {axes.map((axis) => {
                  const position = party.scores.get(axis.id)
                  const isDerived = position?.party_position_evidence?.some(
                    (evidence) => evidence.source_type === 'turetilmis'
                  )

                  return (
                    <td key={axis.id} className="data-figure px-2 py-2 text-right text-ink-secondary">
                      {position ? position.score : '—'}
                      {isDerived && (
                        <span className="text-ink-muted" title="türetilmiş">
                          *<span className="sr-only">türetilmiş</span>
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink-muted">
        * türetilmiş konum · — konum kodlanmamış (bu eksen o parti için karşılaştırmaya girmez)
      </p>
    </Card>
  )
}
