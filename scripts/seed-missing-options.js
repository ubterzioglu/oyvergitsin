/**
 * Seçeneği olmayan sorulara (matris / puan dağıtımı / vinyet) eksik
 * question_options kayıtlarını ekler.
 *
 * Bu sorular seed.js'te oluşturuldu ama seçenekleri hiç yazılmadığı için
 * /survey ekranında boş görünüyorlardı. Matris tipleri "row:" / "col:"
 * önekiyle saklanır (bkz. app/survey/page.tsx splitMatrixOptions).
 *
 * Idempotent: seçeneği zaten olan soruya dokunmaz.
 *
 * Çalıştırma: node scripts/seed-missing-options.js
 */
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

const VIGNETTE_TEXT =
  'Bir belediye, bütçe açığını kapatmak için toplu taşıma ücretlerine %30 zam yapmayı planlıyor. ' +
  'Aynı dönemde düşük gelirli hanelere aylık ulaşım desteği vereceğini açıklıyor.'

// order_index -> eklenecek seçenekler
const OPTIONS_BY_ORDER_INDEX = {
  // matrix_single: satırlar konu, sütunlar katılım derecesi
  7: [
    { text: 'Asgari ücret devlet tarafından belirlenmeli', value: 'row:min_wage' },
    { text: 'Kamu kurumları özelleştirilmeli', value: 'row:privatization' },
    { text: 'Yerel yönetimlere daha fazla yetki verilmeli', value: 'row:local_authority' },
    { text: 'Çevre vergileri artırılmalı', value: 'row:green_tax' },
    { text: 'Katılmıyorum', value: 'col:disagree' },
    { text: 'Kararsızım', value: 'col:neutral' },
    { text: 'Katılıyorum', value: 'col:agree' },
  ],
  // matrix_multi: satırlar politika alanı, sütunlar desteklenen öneriler
  8: [
    { text: 'Eğitim', value: 'row:education' },
    { text: 'Sağlık', value: 'row:health' },
    { text: 'Ekonomi', value: 'row:economy' },
    { text: 'Daha fazla kamu bütçesi', value: 'col:more_budget' },
    { text: 'Özel sektör katılımı', value: 'col:private_sector' },
    { text: 'Yerel yönetime devir', value: 'col:local_management' },
  ],
  // allocation: 100 puanın dağıtılacağı kalemler
  13: [
    { text: 'Eğitim', value: 'education' },
    { text: 'Sağlık', value: 'health' },
    { text: 'Savunma', value: 'defense' },
    { text: 'Sosyal yardımlar', value: 'social_welfare' },
    { text: 'Altyapı ve ulaşım', value: 'infrastructure' },
  ],
  // vignette_likert: 5 noktalı değerlendirme ölçeği
  16: [
    { text: 'Kesinlikle doğru değil', value: 'strongly_disagree' },
    { text: 'Doğru değil', value: 'disagree' },
    { text: 'Kararsızım', value: 'neutral' },
    { text: 'Doğru', value: 'agree' },
    { text: 'Kesinlikle doğru', value: 'strongly_agree' },
  ],
}

async function run() {
  const targetOrderIndexes = Object.keys(OPTIONS_BY_ORDER_INDEX).map(Number)

  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id, order_index, type')
    .in('order_index', targetOrderIndexes)

  if (qError) throw qError

  const { data: existingOptions, error: existingError } = await supabase
    .from('question_options')
    .select('question_id')

  if (existingError) throw existingError

  const questionIdsWithOptions = new Set((existingOptions || []).map((o) => o.question_id))

  const rowsToInsert = []
  for (const question of questions) {
    if (questionIdsWithOptions.has(question.id)) {
      console.log(`Skip order_index=${question.order_index} (${question.type}): options already exist`)
      continue
    }

    OPTIONS_BY_ORDER_INDEX[question.order_index].forEach((opt, idx) => {
      rowsToInsert.push({
        id: generateId(),
        question_id: question.id,
        text: opt.text,
        value: opt.value,
        order_index: idx + 1,
      })
    })
    console.log(
      `Queued ${OPTIONS_BY_ORDER_INDEX[question.order_index].length} options for ` +
        `order_index=${question.order_index} (${question.type})`
    )
  }

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase.from('question_options').insert(rowsToInsert)
    if (insertError) throw insertError
    console.log(`Inserted ${rowsToInsert.length} question_options rows.`)
  } else {
    console.log('Nothing to insert. All target questions already have options.')
  }

  // Vinyet metni ayrı bir kolonda tutulmadığı için description alanında saklanıyor;
  // survey ekranı vignette_likert tipinde description'ı vinyet kutusunda gösterir.
  const vignetteQuestion = questions.find((q) => q.order_index === 16)
  if (vignetteQuestion) {
    const { error: updateError } = await supabase
      .from('questions')
      .update({ description: VIGNETTE_TEXT })
      .eq('id', vignetteQuestion.id)

    if (updateError) throw updateError
    console.log('Updated vignette text for order_index=16.')
  }
}

run().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
