// v2 (8 eksen) parti konumlarını türetip veritabanına yazar.
//
// Dönüşüm kuralları ve gerekçeler scripts/data/party-positions-v2.js içinde;
// insan okuru için özeti docs/party-positions-v2-derivation.md içinde.
//
// Her konum için party_position_evidence satırı da yazılır: kaynak tipi
// "turetilmis" (v1 skorundan kurallı dönüşüm) ya da doğrudan kodlama.
//
//   node scripts/derive-party-positions-v2.js            # yaz
//   node scripts/derive-party-positions-v2.js --dry-run  # yalnızca raporla

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const { AXIS_MODEL } = require('./data/axis-model-v2')
const { deriveAllPositions } = require('./data/party-positions-v2')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Eksik kimlik bilgisi: .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_KEY gerekli.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const dryRun = process.argv.includes('--dry-run')

function unwrap({ data, error }, context) {
  if (error) throw new Error(`${context}: ${error.message}`)
  return data
}

async function loadV2Axes() {
  const model = unwrap(
    await supabase.from('axis_models').select('id').eq('version', AXIS_MODEL.version).maybeSingle(),
    'axis_models okunamadı'
  )

  if (!model) {
    throw new Error('v2 eksen modeli bulunamadı. Önce: node scripts/seed-axis-model-v2.js')
  }

  const axes = unwrap(
    await supabase.from('axes').select('id, slug').eq('axis_model_id', model.id),
    'axes okunamadı'
  )

  return new Map(axes.map((axis) => [axis.slug, axis.id]))
}

async function loadParties() {
  const parties = unwrap(await supabase.from('parties').select('id, short_name'), 'parties okunamadı')
  return new Map(parties.map((party) => [party.short_name, party.id]))
}

async function main() {
  const [axisIdBySlug, partyIdByShortName] = await Promise.all([loadV2Axes(), loadParties()])
  const rows = deriveAllPositions()

  const missingParties = new Set()
  const missingAxes = new Set()
  const writable = []

  for (const row of rows) {
    const partyId = partyIdByShortName.get(row.shortName)
    const axisId = axisIdBySlug.get(row.axisSlug)

    if (!partyId) {
      missingParties.add(row.shortName)
      continue
    }
    if (!axisId) {
      missingAxes.add(row.axisSlug)
      continue
    }

    writable.push({ ...row, partyId, axisId })
  }

  if (missingParties.size > 0) {
    console.warn(`UYARI: parties tablosunda bulunamayan kısa adlar: ${[...missingParties].join(', ')}`)
  }
  if (missingAxes.size > 0) {
    console.warn(`UYARI: v2 modelinde bulunamayan eksenler: ${[...missingAxes].join(', ')}`)
  }

  const lowConfidence = writable.filter((row) => row.confidence === 'düşük')

  if (dryRun) {
    console.table(
      writable.map((row) => ({
        parti: row.shortName,
        eksen: row.axisSlug,
        skor: row.score,
        güven: row.confidence,
      }))
    )
    console.log(`\n${writable.length} konum hesaplandı (yazılmadı — --dry-run).`)
    reportBlockers(lowConfidence)
    return
  }

  const saved = unwrap(
    await supabase
      .from('party_positions')
      .upsert(
        writable.map((row) => ({ party_id: row.partyId, axis_id: row.axisId, score: row.score })),
        { onConflict: 'party_id,axis_id' }
      )
      .select('id, party_id, axis_id'),
    'party_positions yazılamadı'
  )

  console.log(`${saved.length} parti konumu yazıldı.`)

  const positionIdByKey = new Map(saved.map((row) => [`${row.party_id}:${row.axis_id}`, row.id]))
  const positionIds = saved.map((row) => row.id)

  // Kanıt satırları tam olarak yeniden yazılır; kaynak dosya tek doğruluk kaynağıdır.
  unwrap(
    await supabase.from('party_position_evidence').delete().in('party_position_id', positionIds),
    'eski kanıt satırları silinemedi'
  )

  const evidence = writable.map((row) => ({
    party_position_id: positionIdByKey.get(`${row.partyId}:${row.axisId}`),
    source_type: row.isDirectlyCoded ? 'parti_programi' : 'turetilmis',
    source_title: row.isDirectlyCoded
      ? 'Parti programı / seçim beyannamesi (yeni_deep-research-report.md üzerinden)'
      : `v1 eksen skorundan dönüşüm: ${row.sourceAxes.join(' + ')}`,
    source_date: '2026-07-20',
    rationale: `[güvenilirlik: ${row.confidence}] ${row.note}`,
  }))

  unwrap(await supabase.from('party_position_evidence').insert(evidence), 'kanıt satırları yazılamadı')
  console.log(`${evidence.length} kanıt satırı yazıldı.`)

  reportBlockers(lowConfidence)
}

function reportBlockers(lowConfidence) {
  if (lowConfidence.length === 0) return

  console.warn('\n--- YAYIN ÖNCESİ ENGEL ---')
  console.warn(
    `${lowConfidence.length} konum "düşük güvenilirlik" ile işaretli ` +
      `(${[...new Set(lowConfidence.map((row) => row.axisSlug))].join(', ')} ekseni).`
  )
  console.warn('Bu konumlar kaynak belgelerden yeniden kodlanmadan v2 AKTİF EDİLMEMELİDİR.')
  console.warn('Ayrıntı: docs/party-positions-v2-derivation.md')
}

main().catch((error) => {
  console.error('Türetme başarısız:', error.message)
  process.exit(1)
})
