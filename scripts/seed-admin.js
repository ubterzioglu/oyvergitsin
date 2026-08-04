require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const adminEmail = process.env.ADMIN_EMAIL
const adminPassword = process.env.ADMIN_SEED_PASSWORD

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local')
  process.exit(1)
}

if (!adminEmail || !adminPassword) {
  console.error('Missing ADMIN_EMAIL or ADMIN_SEED_PASSWORD in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function seedAdmin() {
  console.log(`Creating admin user ${adminEmail}...`)

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true
  })

  let userId = created?.user?.id

  if (createError) {
    if (!createError.message.includes('already been registered')) {
      throw createError
    }

    console.log('User already exists, looking up existing user...')
    const { data: existing, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    const match = existing.users.find(u => u.email === adminEmail)
    if (!match) throw new Error(`Could not find existing user for ${adminEmail}`)
    userId = match.id

    console.log('Updating existing user password...')
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: adminPassword,
      email_confirm: true
    })

    if (updateError) throw updateError
  }

  console.log('Ensuring "admin" role exists...')
  const { data: adminRole, error: roleError } = await supabase
    .from('roles')
    .upsert({ name: 'admin' }, { onConflict: 'name' })
    .select()
    .single()

  if (roleError) throw roleError

  console.log('Assigning admin role to user...')
  const { error: assignError } = await supabase
    .from('user_roles')
    .upsert(
      { user_id: userId, role_id: adminRole.id },
      { onConflict: 'user_id,role_id' }
    )

  if (assignError) throw assignError

  console.log(`Done. ${adminEmail} can now sign in at /admin/login.`)
}

seedAdmin().catch(error => {
  console.error('Seed failed:', error.message)
  process.exit(1)
})
