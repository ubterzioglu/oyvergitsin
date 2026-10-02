require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const Module = require('module')
const ts = require('typescript')

const TBMM_SEAT_DISTRIBUTION_URL = 'https://www.tbmm.gov.tr/sandalyedagilimi'
const PARSER_RELATIVE_PATH = path.join('lib', 'siyaset-radari', 'parsers', 'tbmm-seat-distribution.ts')

function loadTsModule(relativePath) {
  const absolutePath = path.join(__dirname, '..', relativePath)
  const source = fs.readFileSync(absolutePath, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  })
  const module = new Module(absolutePath)
  module.filename = absolutePath
  module._compile(compiled.outputText, absolutePath)
  return module.exports
}

const { parseTbmmSeatDistribution } = loadTsModule(PARSER_RELATIVE_PATH)

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

async function fetchSeatRows() {
  const response = await fetch(TBMM_SEAT_DISTRIBUTION_URL, {
    headers: {
      'User-Agent': 'oyvergitsin.org public-interest data verifier',
      Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`${TBMM_SEAT_DISTRIBUTION_URL} ${response.status} döndürdü.`)
  }

  const rows = parseTbmmSeatDistribution(await response.text())

  let failures = 0
  failures += rows.length > 0 ? ok(`${rows.length} parti satırı ayrıştırıldı`) : fail('hiç parti satırı ayrıştırılamadı')

  const brokenNames = rows.filter((row) => /&#x?[0-9a-fA-F]+;|&[a-zA-Z]+;/.test(row.partyName))
  failures += brokenNames.length === 0
    ? ok('parti adlarında çözülmemiş HTML entity yok')
    : fail(`${brokenNames.length} parti adında çözülmemiş entity var: ${brokenNames.map((row) => row.partyName).join(', ')}`)

  const duplicates = rows.map((row) => row.partyName).filter((name, index, all) => all.indexOf(name) !== index)
  failures += duplicates.length === 0
    ? ok('yinelenen parti adı yok (cinsiyet tablosu sızmıyor)')
    : fail(`yinelenen parti adı var: ${[...new Set(duplicates)].join(', ')}`)

  const totalSeats = rows.reduce((sum, row) => sum + row.seatCount, 0)
  console.log(`      sandalye toplamı: ${totalSeats}`)
  for (const row of rows) {
    console.log(`      ${row.partyName}: ${row.seatCount}`)
  }

  if (failures > 0) {
    process.exit(1)
  }

  return rows
}

async function refreshDatabase(rows) {
  const { createClient } = require('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Eksik kimlik bilgisi: .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_KEY gerekli.')
    console.error('Sadece ayrıştırma kontrolü için: npm run radar:tbmm -- --dry-run')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const nowIso = new Date().toISOString()
  let inserted = 0
  let updated = 0

  for (const row of rows) {
    const lookup = {
      election_year: 2023,
      election_type: 'tbmm_current_seat_distribution',
      area_level: 'country',
      area_name: 'Türkiye',
      party_name: row.partyName,
    }

    const payload = {
      ...lookup,
      seat_count: row.seatCount,
      vote_count: null,
      vote_share: null,
      source_name: 'Türkiye Büyük Millet Meclisi',
      source_url: TBMM_SEAT_DISTRIBUTION_URL,
      source_confidence: 'official',
      last_verified_at: nowIso,
      raw_payload: row,
    }

    const { data: existing, error: selectError } = await supabase
      .from('election_results_by_area')
      .select('id')
      .match(lookup)
      .maybeSingle()

    if (selectError) {
      throw new Error(selectError.message)
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from('election_results_by_area')
        .update(payload)
        .eq('id', existing.id)

      if (updateError) {
        throw new Error(updateError.message)
      }
      updated += 1
      continue
    }

    // Kayıtlar pending/private girer; yayınlanmadan önce admin onayından geçmek zorunda.
    const { error: insertError } = await supabase.from('election_results_by_area').insert({
      ...payload,
      review_status: 'pending',
      visibility: 'private',
    })

    if (insertError) {
      throw new Error(insertError.message)
    }
    inserted += 1
  }

  ok(`${inserted} yeni kayıt (admin onayı bekliyor), ${updated} kayıt güncellendi`)
  warn('Yeni kayıtlar yayınlanmadan önce admin panelinden onaylanmalıdır.')
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const rows = await fetchSeatRows()

  if (dryRun) {
    console.log('\n--dry-run: veritabanına yazılmadı.')
    return
  }

  await refreshDatabase(rows)
  console.log('\nTBMM sandalye dağılımı tazelendi.')
}

main().catch((error) => {
  console.error('Tazeleme başarısız:', error.message)
  process.exit(1)
})
