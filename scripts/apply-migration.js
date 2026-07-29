// Tek bir migration dosyasını doğrudan Postgres bağlantısı üzerinden uygular.
//
// `supabase db push` veritabanı parolasını etkileşimli olarak sorar ve CI/otomasyon
// içinde çalışmaz. Bu script .env.local içindeki DBLINK bağlantı dizesini kullanır.
// Migration dosyaları idempotent yazıldığı için (IF NOT EXISTS / DROP POLICY IF EXISTS)
// tekrar çalıştırmak güvenlidir.
//
//   node scripts/apply-migration.js 009_axis_model_v2_scoring.sql

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const fileName = process.argv[2]

if (!fileName) {
  console.error('Kullanım: node scripts/apply-migration.js <migration-dosyasi.sql>')
  process.exit(1)
}

const connectionString = process.env.DBLINK

if (!connectionString) {
  console.error('.env.local içinde DBLINK (Postgres bağlantı dizesi) tanımlı değil.')
  process.exit(1)
}

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', fileName)

if (!fs.existsSync(migrationPath)) {
  console.error(`Migration bulunamadı: ${migrationPath}`)
  process.exit(1)
}

async function main() {
  const sql = fs.readFileSync(migrationPath, 'utf8')
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })

  await client.connect()

  try {
    // Tek transaction: bir ifade patlarsa yarım uygulanmış şema kalmasın.
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')
    console.log(`Uygulandı: ${fileName}`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Migration başarısız:', error.message)
  process.exit(1)
})
