// Admin panelinin okuduğu tablolarda RLS politikalarının yerinde olduğunu
// doğrular.
//
// Panel tarayıcıdan anon anahtarla, giriş yapmış admin kullanıcısı olarak
// çalışır; yani her tablonun ya herkese açık bir SELECT politikası ya da
// is_admin() koşullu bir politikası olmalıdır. Politika yoksa RLS varsayılan
// olarak reddeder ve ekran sessizce boş görünür.
//
//   node scripts/check-admin-access.js

require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')

// Panelin okuduğu tablolar ve her birinde beklenen erişim.
const REQUIRED = [
  { table: 'sessions', screen: 'Cevaplar listesi' },
  { table: 'answers', screen: 'Cevap detayı' },
  { table: 'result_snapshots', screen: 'Cevap detayı — sonuç özeti' },
  { table: 'axis_models', screen: 'Model seçici' },
  { table: 'axes', screen: 'Eksenler' },
  { table: 'questions', screen: 'Sorular' },
  { table: 'question_options', screen: 'Soru detayı' },
  { table: 'scoring_rules', screen: 'Soru detayı — puanlama' },
  { table: 'parties', screen: 'Partiler' },
  { table: 'party_positions', screen: 'Partiler — konumlar' },
]

const SQL = `
  select tablename, policyname, cmd, coalesce(qual, '') as qual
  from pg_policies
  where schemaname = 'public' and tablename = any($1)
`

async function main() {
  if (!process.env.DBLINK) {
    console.error('.env.local içinde DBLINK tanımlı değil.')
    process.exit(1)
  }

  const client = new Client({ connectionString: process.env.DBLINK, ssl: { rejectUnauthorized: false } })
  await client.connect()

  const { rows } = await client.query(SQL, [REQUIRED.map((item) => item.table)])
  await client.end()

  let failed = 0

  for (const { table, screen } of REQUIRED) {
    const policies = rows.filter((row) => row.tablename === table)
    const readable = policies.filter((row) => row.cmd === 'SELECT' || row.cmd === 'ALL')

    const publicRead = readable.some((row) => row.qual.trim() === 'true')
    const adminRead = readable.some((row) => row.qual.includes('is_admin'))

    if (!publicRead && !adminRead) {
      failed += 1
      console.log(`HATA  ${table.padEnd(22)} okuma politikası yok — "${screen}" boş görünür`)
      continue
    }

    const how = publicRead ? 'herkese açık' : 'admin'
    console.log(`OK    ${table.padEnd(22)} ${how.padEnd(13)} (${screen})`)
  }

  if (failed > 0) {
    console.error(`\n${failed} tablo panelden okunamaz.`)
    process.exit(1)
  }

  console.log('\nPanelin ihtiyaç duyduğu tüm okuma politikaları yerinde.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
