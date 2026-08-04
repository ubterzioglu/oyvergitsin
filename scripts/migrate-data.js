const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const OLD_DB_URL = 'https://ytcckzqafbfshiztlqaq.supabase.co'
const OLD_SERVICE_KEY = process.env.OLD_SERVICE_KEY || ''
const NEW_DB_URL = 'https://inejvgbkesnrohvjqmon.supabase.co'
const NEW_SERVICE_KEY = process.env.NEW_SERVICE_KEY || ''

const BATCH_SIZE = 100

if (!OLD_SERVICE_KEY || !NEW_SERVICE_KEY) {
  console.error('ERROR: OLD_SERVICE_KEY and NEW_SERVICE_KEY env vars required.')
  console.error('Usage: OLD_SERVICE_KEY=<old_service_key> NEW_SERVICE_KEY=<new_service_key> node scripts/migrate-data.js')
  console.error('')
  console.error(`Get the old service key from: https://supabase.com/dashboard/project/${OLD_DB_URL.replace('https://', '').replace('.supabase.co', '')}/settings/api`)
  console.error(`Get the new service key from: https://supabase.com/dashboard/project/${NEW_DB_URL.replace('https://', '').replace('.supabase.co', '')}/settings/api`)
  process.exit(1)
}

const oldDb = createClient(OLD_DB_URL, OLD_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})
const newDb = createClient(NEW_DB_URL, NEW_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const stats = {}
const sqlLines = [
  '-- Oyvergitsin Veri Migrasyonu',
  `-- Tarih: ${new Date().toISOString()}`,
  '-- Kaynak: 8068ca9136860e0c323555cbdbf2d35835f58cb8 (eski)',
  '-- Hedef: ytcckzqafbfshiztlqaq (yeni)',
  '',
  'BEGIN;',
  ''
]

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'object') return "'" + JSON.stringify(val).replace(/'/g, "''") + "'"
  return "'" + String(val).replace(/'/g, "''") + "'"
}

async function fetchAll(table) {
  const allRows = []
  let from = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await oldDb
      .from(table)
      .select('*')
      .range(from, from + BATCH_SIZE - 1)

    if (error) {
      console.error(`  [READ ERROR] ${table}:`, error.message)
      return allRows
    }

    allRows.push(...data)
    hasMore = data.length === BATCH_SIZE
    from += BATCH_SIZE
  }

  return allRows
}

async function insertBatch(table, rows, conflictColumns) {
  if (rows.length === 0) return { ok: 0, fail: 0 }

  let ok = 0
  let fail = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await newDb
      .from(table)
      .upsert(batch, { onConflict: conflictColumns, ignoreDuplicates: true })

    if (error) {
      console.error(`  [WRITE ERROR] ${table} batch ${Math.floor(i / BATCH_SIZE)}:`, error.message)
      fail += batch.length
    } else {
      ok += batch.length
    }
  }

  return { ok, fail }
}

function addSqlBlock(table, columns, rows) {
  if (rows.length === 0) return

  sqlLines.push(`-- ${table}`)
  for (const row of rows) {
    const vals = columns.map(c => escapeSql(row[c]))
    sqlLines.push(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;`)
  }
  sqlLines.push('')
}

async function migrateAuthUsers() {
  console.log('\n=== FAZ 1: Auth Kullanıcıları ===')

  const allUsers = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const { data, error } = await oldDb.auth.admin.listUsers({ page, perPage: 100 })
    if (error) {
      console.error('  [AUTH READ ERROR]:', error.message)
      break
    }

    allUsers.push(...data.users)
    hasMore = data.users.length === 100
    page++
  }

  console.log(`  Eski DB'den ${allUsers.length} auth kullanıcı okundu`)

  let ok = 0
  let fail = 0

  for (const user of allUsers) {
    try {
      const { error } = await newDb.auth.admin.createUser({
        id: user.id,
        email: user.email,
        email_confirm: true,
        user_metadata: user.user_metadata || {},
        app_metadata: user.app_metadata || {},
      })

      if (error) {
        if (error.message?.includes('already been registered') || error.message?.includes('already exists')) {
          ok++
        } else {
          console.error(`  [AUTH CREATE ERROR] ${user.email}:`, error.message)
          fail++
        }
      } else {
        ok++
      }
    } catch (err) {
      console.error(`  [AUTH CREATE EXCEPTION] ${user.email}:`, err.message)
      fail++
    }
  }

  stats['auth_users'] = { ok, fail }
  console.log(`  Auth: ${ok} ok, ${fail} fail`)

  sqlLines.push('-- auth users (cannot be replayed from SQL, managed by Supabase Auth)')
  sqlLines.push(`-- Total: ${allUsers.length} users migrated`)
  for (const user of allUsers) {
    sqlLines.push(`-- User: ${user.id} (${user.email})`)
  }
  sqlLines.push('')
}

const TABLE_ORDER = [
  { table: 'roles', conflict: 'name', deps: [] },
  { table: 'consent_texts', conflict: 'version', deps: [] },
  { table: 'axis_models', conflict: 'id', deps: [] },
  { table: 'parties', conflict: 'id', deps: [] },
  { table: 'questions', conflict: 'id', deps: [] },
  { table: 'axes', conflict: 'id', deps: ['axis_models'] },
  { table: 'user_roles', conflict: 'id', deps: ['roles'] },
  { table: 'question_options', conflict: 'id', deps: ['questions'] },
  { table: 'scoring_rules', conflict: 'id', deps: ['questions', 'axes'] },
  { table: 'party_positions', conflict: 'id', deps: ['parties', 'axes'] },
  { table: 'sessions', conflict: 'id', deps: [] },
  { table: 'answers', conflict: 'id', deps: ['sessions', 'questions'] },
  { table: 'result_snapshots', conflict: 'id', deps: ['sessions'] },
  { table: 'behavior_events', conflict: 'id', deps: ['sessions'] },
]

const TABLE_COLUMNS = {
  roles: ['id', 'name', 'created_at'],
  consent_texts: ['id', 'version', 'text', 'is_active', 'created_at', 'updated_at'],
  axis_models: ['id', 'name', 'version', 'is_active', 'created_at'],
  parties: ['id', 'name', 'short_name', 'color', 'logo_url', 'description', 'created_at', 'updated_at'],
  questions: ['id', 'text', 'type', 'description', 'required', 'order_index', 'created_at', 'updated_at'],
  axes: ['id', 'axis_model_id', 'name', 'description', 'slug', 'order_index', 'created_at'],
  user_roles: ['id', 'user_id', 'role_id', 'created_at'],
  question_options: ['id', 'question_id', 'text', 'value', 'order_index', 'created_at'],
  scoring_rules: ['id', 'question_id', 'answer_value', 'axis_id', 'score_modifier', 'created_at'],
  party_positions: ['id', 'party_id', 'axis_id', 'score', 'created_at', 'updated_at'],
  sessions: ['id', 'user_id', 'ip_hash', 'device_hash', 'consent_version', 'is_guest', 'risk_score', 'created_at', 'completed_at'],
  answers: ['id', 'session_id', 'question_id', 'answer_value', 'created_at'],
  result_snapshots: ['id', 'session_id', 'axis_scores', 'party_similarities', 'created_at'],
  behavior_events: ['id', 'session_id', 'event_type', 'event_data', 'timestamp'],
}

async function migrateDataTables() {
  console.log('\n=== FAZ 2: Veri Tabloları ===')

  for (const { table, conflict } of TABLE_ORDER) {
    console.log(`\n  Migrating: ${table}`)
    const rows = await fetchAll(table)
    console.log(`    Read: ${rows.length} rows`)

    const { ok, fail } = await insertBatch(table, rows, conflict)
    stats[table] = { ok, fail }
    console.log(`    Written: ${ok} ok, ${fail} fail`)

    const columns = TABLE_COLUMNS[table] || Object.keys(rows[0] || {})
    addSqlBlock(table, columns, rows)
  }
}

async function main() {
  console.log('=== Oyvergitsin Veri Migrasyonu ===')
  console.log(`Source: ${OLD_DB_URL}`)
  console.log(`Target: ${NEW_DB_URL}`)
  console.log(`Started: ${new Date().toISOString()}`)

  try {
    await migrateAuthUsers()
    await migrateDataTables()

    sqlLines.push('COMMIT;')

    const sqlPath = path.join(__dirname, 'migration-data.sql')
    fs.writeFileSync(sqlPath, sqlLines.join('\n'), 'utf-8')
    console.log(`\nSQL dump written to: ${sqlPath}`)

    console.log('\n=== MIGRATION SUMMARY ===')
    let totalOk = 0
    let totalFail = 0
    for (const [table, { ok, fail }] of Object.entries(stats)) {
      console.log(`  ${table}: ${ok} ok, ${fail} fail`)
      totalOk += ok
      totalFail += fail
    }
    console.log(`  TOTAL: ${totalOk} ok, ${totalFail} fail`)
    console.log(`Finished: ${new Date().toISOString()}`)

    if (totalFail > 0) {
      console.warn('\nWARNING: Some rows failed. Check errors above.')
    }
  } catch (err) {
    console.error('FATAL:', err)
    process.exit(1)
  }
}

main()
