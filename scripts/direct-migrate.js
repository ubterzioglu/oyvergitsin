require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')

function getMigrationFiles() {
  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b))
}

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local')
  process.exit(1)
}

async function runMigrations() {
  console.log('Preparing database migrations for Supabase SQL Editor...')

  try {
    const migrationFiles = getMigrationFiles()
    const migrationSQL = migrationFiles
      .map((file) => {
        const migrationPath = path.join(migrationsDir, file)
        const content = fs.readFileSync(migrationPath, 'utf8').trim()
        return `-- >>> ${file}\n${content}\n`
      })
      .join('\n')

    console.log('\n' + '='.repeat(60))
    console.log('Please copy and run the following SQL in your Supabase dashboard:')
    console.log(`Project URL: ${supabaseUrl}`)
    console.log('Go to: https://app.supabase.com/project/_/sql/new')
    console.log(`Included migrations: ${migrationFiles.join(', ')}`)
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
