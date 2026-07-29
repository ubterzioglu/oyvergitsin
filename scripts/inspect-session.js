// Bir oturumun kaydedilmiş cevaplarını ve sonuç anlık görüntüsünü döker.
// Skorlama davranışını incelerken kullanılır.
//
//   node scripts/inspect-session.js <sessionId>

require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')

const sessionId = process.argv[2]

if (!sessionId) {
  console.error('Kullanım: node scripts/inspect-session.js <sessionId>')
  process.exit(1)
}

async function main() {
  const client = new Client({ connectionString: process.env.DBLINK, ssl: { rejectUnauthorized: false } })
  await client.connect()

  const answers = await client.query(
    `select q.code, q.type, a.answer_value, a.is_important
     from answers a join questions q on q.id = a.question_id
     where a.session_id = $1
     order by q.order_index`,
    [sessionId]
  )

  console.log(`Cevaplar (${answers.rowCount}):`)
  for (const row of answers.rows) {
    console.log(
      `  ${String(row.code).padEnd(14)} ${row.answer_value}${row.is_important ? '  [önemli]' : ''}`
    )
  }

  const snapshot = await client.query(
    'select algorithm_version, axis_scores, axis_coverage, quality_flags from result_snapshots where session_id = $1',
    [sessionId]
  )

  if (snapshot.rowCount === 0) {
    console.log('\nSnapshot yok.')
  } else {
    const row = snapshot.rows[0]
    console.log(`\nAlgoritma sürümü: ${row.algorithm_version}`)
    console.log(`Kalite bayrakları: ${JSON.stringify(row.quality_flags)}`)

    const axes = await client.query(
      'select id, slug from axes where id = any($1)',
      [Object.keys(row.axis_scores || {})]
    )
    const slugById = new Map(axes.rows.map((axis) => [axis.id, axis.slug]))

    console.log('\nEksen skorları (kapsama):')
    for (const [axisId, score] of Object.entries(row.axis_scores || {})) {
      const coverage = (row.axis_coverage || {})[axisId]
      console.log(
        `  ${String(slugById.get(axisId) ?? axisId).padEnd(12)} ${String(score).padStart(5)}  kapsama ${coverage}`
      )
    }
  }

  await client.end()
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
