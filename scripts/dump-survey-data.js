/**
 * Anket veri kümesini (sorular, seçenekler, puanlama kuralları, eksenler,
 * partiler ve parti pozisyonları) tek bir JSON dosyasına döker.
 *
 * Sorular veritabanında yaşadığı için git branch'i tek başına geri dönüş
 * noktası sağlamaz; soru seti değiştirilmeden önce bu dosya alınmalıdır.
 *
 * Kullanım:
 *   node scripts/dump-survey-data.js [çıktı-dosyası]
 *   (varsayılan: supabase/snapshots/survey-data.json)
 */
require('dotenv').config({ path: '.env.local', quiet: true })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const TABLES = [
  { name: 'axes', orderBy: 'name' },
  { name: 'parties', orderBy: 'name' },
  { name: 'party_positions', orderBy: 'party_id' },
  { name: 'questions', orderBy: 'order_index' },
  { name: 'question_options', orderBy: 'question_id' },
  { name: 'scoring_rules', orderBy: 'question_id' },
]

const outputPath = process.argv[2] || path.join('supabase', 'snapshots', 'survey-data.json')

async function run() {
  const dump = { tables: {} }

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table.name).select('*').order(table.orderBy)
    if (error) throw new Error(`${table.name}: ${error.message}`)
    dump.tables[table.name] = data || []
    console.log(`${table.name}: ${dump.tables[table.name].length} satır`)
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(dump, null, 2), 'utf8')
  console.log(`\nYazıldı: ${outputPath}`)
}

run().catch((error) => {
  console.error('Dump failed:', error.message)
  process.exit(1)
})
