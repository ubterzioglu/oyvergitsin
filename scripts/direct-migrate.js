require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigrations() {
  console.log('Running database migrations via Supabase SQL Editor...')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('\n' + '='.repeat(60))
    console.log('Please copy and run the following SQL in your Supabase dashboard:')
    console.log('Go to: https://app.supabase.com/project/_/sql/new')
    console.log('='.repeat(60) + '\n')

    console.log(migrationSQL)
    console.log('\n' + '='.repeat(60))
    console.log('After running the SQL, you can run: npm run db:seed')
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

runMigrations()
