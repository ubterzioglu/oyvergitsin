// Hassas tablolarda anon (giriş yapmamış) erişimin gerçekte ne olduğunu döker.
//
// Supabase'in REST ucu anon anahtarla doğrudan çağrılabilir; Next.js API
// katmanındaki oturum sahipliği kontrolü bu yolu KORUMAZ. Bu yüzden koruma
// RLS seviyesinde olmak zorundadır.
//
//   node scripts/audit-rls.js

require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')

const SENSITIVE = [
  'answers',
  'sessions',
  'result_snapshots',
  'behavior_events',
  'public_people',
  'political_affiliation_events',
  'journalist_status_events',
  'public_data_evidence',
  'public_data_review_logs',
  'election_results_by_area',
]

async function main() {
  const client = new Client({ connectionString: process.env.DBLINK, ssl: { rejectUnauthorized: false } })
  await client.connect()

  const { rows } = await client.query(
    `select tablename, policyname, cmd, roles::text as roles,
            coalesce(qual, '-') as qual, coalesce(with_check, '-') as with_check
     from pg_policies
     where schemaname = 'public' and tablename = any($1)
     order by tablename, cmd, policyname`,
    [SENSITIVE]
  )

  await client.end()

  let openPolicies = 0

  for (const table of SENSITIVE) {
    console.log(`\n${table}`)
    const policies = rows.filter((row) => row.tablename === table)

    if (policies.length === 0) {
      console.log('  (politika yok — RLS varsayılan olarak reddeder)')
      continue
    }

    for (const policy of policies) {
      const wideOpen = policy.qual.trim() === 'true' || policy.with_check.trim() === 'true'
      const risky = wideOpen && ['SELECT', 'UPDATE', 'DELETE', 'ALL'].includes(policy.cmd)
      if (risky) openPolicies += 1

      console.log(
        `  ${risky ? '!!' : '  '} ${policy.cmd.padEnd(6)} ${policy.policyname}\n` +
          `       using: ${policy.qual}\n` +
          `       check: ${policy.with_check}`
      )
    }
  }

  if (openPolicies > 0) {
    console.log(
      `\n${openPolicies} politika koşulsuz açık (!!). Anon anahtara sahip herkes bu işlemi yapabilir.`
    )
    process.exit(1)
  }

  console.log('\nHassas tablolarda koşulsuz açık okuma/yazma politikası yok.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
