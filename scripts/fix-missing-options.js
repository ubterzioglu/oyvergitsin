require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const generateId = () => crypto.randomUUID()

const OPTIONS_BY_ORDER_INDEX = {
  5: [
    { text: 'Ekonomi', value: 'economy' },
    { text: 'Eğitim', value: 'education' },
    { text: 'Sağlık', value: 'health' },
    { text: 'Güvenlik', value: 'security' },
    { text: 'Çevre', value: 'environment' }
  ],
  3: [
    { text: 'Merkezi müfredat', value: 'centralized' },
    { text: 'Yerel özerklik', value: 'local_autonomy' },
    { text: 'Özel eğitim teşviki', value: 'private_incentive' },
    { text: 'Karma model', value: 'mixed' }
  ],
  4: [
    { text: 'AB ile entegrasyon', value: 'eu_integration' },
    { text: 'Bölgesel ittifaklar', value: 'regional_alliances' },
    { text: 'Ekonomik anlaşmalar', value: 'economic_agreements' },
    { text: 'Savunma işbirliği', value: 'defense_cooperation' }
  ],
  6: [
    { text: 'Bireysel özgürlük', value: 'individual_freedom' },
    { text: 'Toplumsal düzen', value: 'social_order' }
  ],
  10: [
    { text: 'Kesinlikle katılmıyorum', value: 'strongly_disagree' },
    { text: 'Katılmıyorum', value: 'disagree' },
    { text: 'Kısmen katılmıyorum', value: 'somewhat_disagree' },
    { text: 'Kararsızım', value: 'neutral' },
    { text: 'Kısmen katılıyorum', value: 'somewhat_agree' },
    { text: 'Katılıyorum', value: 'agree' },
    { text: 'Kesinlikle katılıyorum', value: 'strongly_agree' }
  ],
  14: [
    { text: 'Kamu harcamalarını artır', value: 'increase_spending' },
    { text: 'Vergileri düşür', value: 'lower_taxes' },
    { text: 'Faiz oranlarını yükselt', value: 'raise_rates' },
    { text: 'Müdahale etme', value: 'no_intervention' }
  ],
  15: [
    { text: 'İşsizlik yardımını artır', value: 'increase_benefits' },
    { text: 'Küçük işletmelere destek', value: 'sme_support' },
    { text: 'Kamu istihdamı yarat', value: 'public_jobs' },
    { text: 'Ithalatı kısıtla', value: 'import_restriction' }
  ],
  19: [
    { text: 'Sembol A', value: 'symbol_a' },
    { text: 'Sembol B', value: 'symbol_b' },
    { text: 'Sembol C', value: 'symbol_c' }
  ],
  20: [
    { text: 'Görsel 1', value: 'image_1' },
    { text: 'Görsel 2', value: 'image_2' },
    { text: 'Görsel 3', value: 'image_3' }
  ],
  23: [
    { text: 'Kişisel verilerimin işlenmesini kabul ediyorum', value: 'data_consent' },
    { text: 'Katılım koşullarını kabul ediyorum', value: 'terms_consent' }
  ],
  24: [
    { text: 'Evet', value: 'yes' },
    { text: 'Hayır', value: 'no' }
  ]
}

async function run() {
  console.log('Fetching questions...')
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id, order_index, type')
    .in('order_index', Object.keys(OPTIONS_BY_ORDER_INDEX).map(Number))

  if (qError) throw qError

  const { data: existingOptions, error: existingError } = await supabase
    .from('question_options')
    .select('question_id')

  if (existingError) throw existingError

  const questionIdsWithOptions = new Set((existingOptions || []).map(o => o.question_id))

  const rowsToInsert = []
  for (const question of questions) {
    if (questionIdsWithOptions.has(question.id)) {
      console.log(`Skip order_index=${question.order_index} (${question.type}): options already exist`)
      continue
    }
    const options = OPTIONS_BY_ORDER_INDEX[question.order_index]
    options.forEach((opt, idx) => {
      rowsToInsert.push({
        id: generateId(),
        question_id: question.id,
        text: opt.text,
        value: opt.value,
        order_index: idx + 1
      })
    })
    console.log(`Queued ${options.length} options for order_index=${question.order_index} (${question.type})`)
  }

  if (rowsToInsert.length === 0) {
    console.log('Nothing to insert. All target questions already have options.')
    return
  }

  const { error: insertError } = await supabase
    .from('question_options')
    .insert(rowsToInsert)

  if (insertError) throw insertError

  console.log(`Inserted ${rowsToInsert.length} question_options rows.`)
}

run().catch(error => {
  console.error('Fix failed:', error)
  process.exit(1)
})
