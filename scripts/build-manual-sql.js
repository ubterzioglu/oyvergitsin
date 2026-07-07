const fs = require('fs')
const path = require('path')

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
const outputPath = path.join(__dirname, '..', 'supabase', 'manual-apply.sql')

function getMigrationFiles() {
  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b))
}

function buildSqlBundle() {
  const files = getMigrationFiles()

  if (files.length === 0) {
    throw new Error('No SQL migration files found in supabase/migrations')
  }

  const sections = files.map((file) => {
    const filePath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(filePath, 'utf8').trim()
    return `-- >>> ${file}\n${sql}\n`
  })

  return {
    files,
    content: [
      '-- Oyvergitsin manual SQL bundle',
      `-- Generated at: ${new Date().toISOString()}`,
      '-- Apply in Supabase SQL Editor if `supabase db push` is not available.',
      '',
      ...sections
    ].join('\n')
  }
}

function main() {
  const { files, content } = buildSqlBundle()
  fs.writeFileSync(outputPath, `${content}\n`, 'utf8')

  console.log(`Generated ${outputPath}`)
  console.log(`Included migrations: ${files.join(', ')}`)
}

main()
