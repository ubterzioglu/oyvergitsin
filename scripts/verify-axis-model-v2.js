// v2 eksen modelinin veritabanındaki durumunu doğrular.
//
// Migration + seed + parti konumu türetmesinden sonra çalıştırılır; beklenen
// sayıları ve kritik değişmezleri kontrol eder. Hiçbir şey yazmaz.
//
//   node scripts/verify-axis-model-v2.js

require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')

const CHECKS = [
  {
    label: 'v2 eksen sayısı',
    sql: "select count(*)::int as n from axes a join axis_models m on m.id=a.axis_model_id where m.version='v2'",
    expect: (rows) => rows[0].n === 8,
    describe: (rows) => `${rows[0].n} (beklenen 8)`,
  },
  {
    label: 'v2 soru sayısı',
    sql: "select count(*) filter (where is_scored)::int as puanlanan, count(*)::int as toplam from questions q join axis_models m on m.id=q.axis_model_id where m.version='v2'",
    expect: (rows) => rows[0].puanlanan === 24 && rows[0].toplam === 25,
    describe: (rows) => `${rows[0].puanlanan} puanlanan / ${rows[0].toplam} toplam (beklenen 24 / 25)`,
  },
  {
    label: 'v2 puanlama kuralı',
    sql: "select count(*)::int as n from scoring_rules r join questions q on q.id=r.question_id join axis_models m on m.id=q.axis_model_id where m.version='v2'",
    expect: (rows) => rows[0].n === 120,
    describe: (rows) => `${rows[0].n} (beklenen 120 = 24 madde × 5 seçenek)`,
  },
  {
    label: 'v2 seçenek sayısı',
    sql: "select count(*)::int as n from question_options o join questions q on q.id=o.question_id join axis_models m on m.id=q.axis_model_id where m.version='v2'",
    expect: (rows) => rows[0].n === 150,
    describe: (rows) => `${rows[0].n} (beklenen 150 = 25 madde × 6 seçenek)`,
  },
  {
    label: '"fikrim yok" için kural YOK',
    sql: "select count(*)::int as n from scoring_rules where answer_value='no_opinion'",
    expect: (rows) => rows[0].n === 0,
    describe: (rows) => `${rows[0].n} kural (beklenen 0 — aksi halde skordan dışlanmaz)`,
  },
  {
    label: 'her eksende ters kodlanmış madde',
    sql: `select count(distinct a.slug)::int as n from scoring_rules r
          join questions q on q.id=r.question_id
          join axes a on a.id=r.axis_id
          join axis_models m on m.id=q.axis_model_id
          where m.version='v2' and r.answer_value='strongly_agree' and r.score_modifier < 0`,
    expect: (rows) => rows[0].n === 8,
    describe: (rows) => `${rows[0].n} eksen (beklenen 8)`,
  },
  {
    label: 'v2 parti konumu',
    sql: "select count(distinct party_id)::int as parti, count(*)::int as satir from party_positions p join axes a on a.id=p.axis_id join axis_models m on m.id=a.axis_model_id where m.version='v2'",
    expect: (rows) => rows[0].parti === 9 && rows[0].satir === 72,
    describe: (rows) => `${rows[0].parti} parti / ${rows[0].satir} satır (beklenen 9 / 72)`,
  },
  {
    label: 'her konumun kanıt kaydı var',
    sql: `select count(*)::int as n from party_positions p
          join axes a on a.id=p.axis_id
          join axis_models m on m.id=a.axis_model_id
          left join party_position_evidence e on e.party_position_id = p.id
          where m.version='v2' and e.id is null`,
    expect: (rows) => rows[0].n === 0,
    describe: (rows) => `${rows[0].n} kanıtsız konum (beklenen 0)`,
  },
  {
    label: 'v1 demo içeriği korunuyor',
    sql: "select count(*)::int as n from questions q join axis_models m on m.id=q.axis_model_id where m.version='v1'",
    expect: (rows) => rows[0].n > 0,
    describe: (rows) => `${rows[0].n} v1 sorusu arşivde`,
  },
  {
    label: 'tek aktif eksen modeli',
    sql: 'select count(*)::int as n from axis_models where is_active = true',
    expect: (rows) => rows[0].n === 1,
    describe: (rows) => `${rows[0].n} aktif model (beklenen 1)`,
  },
]

async function main() {
  if (!process.env.DBLINK) {
    console.error('.env.local içinde DBLINK tanımlı değil.')
    process.exit(1)
  }

  const client = new Client({ connectionString: process.env.DBLINK, ssl: { rejectUnauthorized: false } })
  await client.connect()

  let failed = 0

  try {
    const models = await client.query('select version, is_active from axis_models order by created_at')
    console.log('Eksen modelleri:')
    for (const model of models.rows) {
      console.log(`  ${model.version}${model.is_active ? '  [AKTİF]' : ''}`)
    }
    console.log('')

    for (const check of CHECKS) {
      const { rows } = await client.query(check.sql)
      const ok = check.expect(rows)
      if (!ok) failed += 1
      console.log(`${ok ? 'OK  ' : 'HATA'}  ${check.label}: ${check.describe(rows)}`)
    }

    const lowConfidence = await client.query(
      "select count(*)::int as n from party_position_evidence where rationale like '%güvenilirlik: düşük%'"
    )
    if (lowConfidence.rows[0].n > 0) {
      console.log(
        `\nUYARI  ${lowConfidence.rows[0].n} konum "düşük güvenilirlik" ile işaretli. ` +
          'Yeniden kodlanmadan v2 aktif edilmemeli (docs/party-positions-v2-derivation.md).'
      )
    }
  } finally {
    await client.end()
  }

  if (failed > 0) {
    console.error(`\n${failed} kontrol başarısız.`)
    process.exit(1)
  }

  console.log('\nTüm kontroller geçti.')
}

main().catch((error) => {
  console.error('Doğrulama başarısız:', error.message)
  process.exit(1)
})
