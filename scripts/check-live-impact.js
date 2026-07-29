// Canlıdaki eski kodun (model filtresi olmayan) v2 verisinden nasıl
// etkilendiğini ölçer. Yalnızca okur.

require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')

const QUERIES = [
  ['toplam soru (eski kod hepsini gösterir)', 'select count(*)::int as n from questions'],
  [
    'toplam eksen (eski motor hepsini okur)',
    'select count(*)::int as n from axes',
  ],
  [
    'toplam parti konumu (eski motor hepsini okur)',
    'select count(*)::int as n from party_positions',
  ],
  [
    'v2 sorularına verilmiş cevap',
    `select count(*)::int as n from answers a
     join questions q on q.id = a.question_id
     join axis_models m on m.id = q.axis_model_id
     where m.version = 'v2'`,
  ],
  [
    'v2 sorusu cevaplamış oturum',
    `select count(distinct a.session_id)::int as n from answers a
     join questions q on q.id = a.question_id
     join axis_models m on m.id = q.axis_model_id
     where m.version = 'v2'`,
  ],
  [
    'v2 yazıldıktan SONRA açılan oturum',
    `select count(*)::int as n from sessions s
     where s.created_at > (select min(a.created_at) from axes a
                           join axis_models m on m.id = a.axis_model_id
                           where m.version = 'v2')`,
  ],
  [
    'bunlardan v1 sorusu da cevaplayan (gerçek kullanıcı şüphesi)',
    `select count(distinct s.id)::int as n from sessions s
     join answers a on a.session_id = s.id
     join questions q on q.id = a.question_id
     join axis_models m on m.id = q.axis_model_id
     where m.version = 'v1'
       and s.created_at > (select min(x.created_at) from axes x
                           join axis_models mm on mm.id = x.axis_model_id
                           where mm.version = 'v2')`,
  ],
]

async function main() {
  const client = new Client({ connectionString: process.env.DBLINK, ssl: { rejectUnauthorized: false } })
  await client.connect()

  for (const [label, sql] of QUERIES) {
    const { rows } = await client.query(sql)
    console.log(`${String(rows[0].n).padStart(6)}  ${label}`)
  }

  await client.end()
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
