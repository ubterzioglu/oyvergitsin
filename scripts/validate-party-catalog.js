require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Eksik kimlik bilgisi: .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_KEY gerekli.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function fail(message) {
  console.error(`HATA  ${message}`)
  return 1
}

function ok(message) {
  console.log(`OK    ${message}`)
  return 0
}

function warn(message) {
  console.warn(`UYARI ${message}`)
}

async function unwrap(promise, context) {
  const { data, error } = await promise
  if (error) throw new Error(`${context}: ${error.message}`)
  return data ?? []
}

function countBy(rows, keyFn) {
  const counts = new Map()
  for (const row of rows) {
    const key = keyFn(row)
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

async function main() {
  let failures = 0

  const parties = await unwrap(
    supabase
      .from('parties')
      .select('id, name, short_name, official_name, registry_external_id, match_status, registry_status'),
    'parties okunamadı'
  )

  failures += parties.length > 0 ? ok(`${parties.length} parti kaydı okundu`) : fail('parties tablosu boş')

  const invalidNames = parties.filter((party) => {
    const officialName = party.official_name ?? party.name
    return !officialName || ['', '-'].includes(officialName.trim())
  })
  failures += invalidNames.length === 0
    ? ok('geçersiz resmi parti adı yok')
    : fail(`${invalidNames.length} partide geçersiz resmi ad var`)

  const registryDuplicates = [...countBy(parties, (party) => party.registry_external_id).entries()]
    .filter(([, count]) => count > 1)
  failures += registryDuplicates.length === 0
    ? ok('registry_external_id çakışması yok')
    : fail(`${registryDuplicates.length} registry_external_id çakışması var`)

  const shortNameDuplicates = [...countBy(parties, (party) => party.short_name).entries()]
    .filter(([, count]) => count > 1)
  if (shortNameDuplicates.length > 0) {
    warn(`${shortNameDuplicates.length} kısa ad birden fazla partide kullanılıyor; bu kalite uyarısıdır, hata değildir`)
  } else {
    ok('kısa ad çakışması yok')
  }

  const invalidStatuses = parties.filter(
    (party) =>
      !['active', 'dissolved', 'closed_by_court', 'merged', 'unknown'].includes(party.registry_status) ||
      !['catalog_only', 'researching', 'eligible', 'suspended'].includes(party.match_status)
  )
  failures += invalidStatuses.length === 0
    ? ok('registry_status ve match_status değerleri geçerli')
    : fail(`${invalidStatuses.length} partide geçersiz status değeri var`)

  const activeModels = await unwrap(
    supabase.from('axis_models').select('id, version').eq('is_active', true).limit(2),
    'aktif eksen modeli okunamadı'
  )

  if (activeModels.length !== 1) {
    failures += fail(`${activeModels.length} aktif eksen modeli var; beklenen 1`)
  } else {
    ok(`aktif eksen modeli: ${activeModels[0].version}`)

    const axes = await unwrap(
      supabase.from('axes').select('id').eq('axis_model_id', activeModels[0].id),
      'aktif eksenler okunamadı'
    )
    const axisIds = axes.map((axis) => axis.id)
    const minCoverage = Math.ceil(axisIds.length * 0.75)
    const eligibleParties = parties.filter((party) => party.match_status === 'eligible')

    const positions = axisIds.length > 0
      ? await unwrap(
          supabase.from('party_positions').select('id, party_id, axis_id').in('axis_id', axisIds),
          'party_positions okunamadı'
        )
      : []
    const positionsByParty = new Map()
    for (const position of positions) {
      const set = positionsByParty.get(position.party_id) ?? new Set()
      set.add(position.axis_id)
      positionsByParty.set(position.party_id, set)
    }

    const underCovered = eligibleParties.filter((party) => (positionsByParty.get(party.id)?.size ?? 0) < minCoverage)
    failures += underCovered.length === 0
      ? ok(`eligible partiler en az ${minCoverage}/${axisIds.length} eksende konumlu`)
      : fail(`${underCovered.length} eligible parti eksen kapsamı eşiğinin altında`)

    const evidenceRows = await unwrap(
      supabase.from('party_position_evidence').select('party_position_id'),
      'party_position_evidence okunamadı'
    )
    const evidenced = new Set(evidenceRows.map((row) => row.party_position_id))
    const eligibleIds = new Set(eligibleParties.map((party) => party.id))
    const unevidenced = positions.filter((position) => eligibleIds.has(position.party_id) && !evidenced.has(position.id))
    failures += unevidenced.length === 0
      ? ok('eligible parti konumlarında kanıtsız satır yok')
      : fail(`${unevidenced.length} eligible parti konumu kanıtsız`)
  }

  if (failures > 0) {
    console.error(`\n${failures} doğrulama hatası var.`)
    process.exit(1)
  }

  console.log('\nParti katalog doğrulaması geçti.')
}

main().catch((error) => {
  console.error('Doğrulama başarısız:', error.message)
  process.exit(1)
})
