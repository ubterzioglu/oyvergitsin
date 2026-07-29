// Türkiye Siyasi Eksen Modeli v2 içeriğini veritabanına yazar.
//
// Model KASITLI OLARAK PASİF (is_active = false) seed edilir. Böylece motor,
// parti pozisyonları ve UI hazırlanırken canlı anket v1 ile çalışmaya devam
// eder. Devreye alma ayrı bir adımdır:
//
//   node scripts/seed-axis-model-v2.js --activate
//
// Yeniden çalıştırılabilir: eksenler slug, sorular (axis_model_id, code) ikilisi
// üzerinden upsert edilir. Var olan bir maddenin cevabı silinmez.
//
// Kaynak içerik: scripts/data/axis-model-v2.js

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const {
  AXIS_MODEL,
  AXES,
  LIKERT_OPTIONS,
  LIKERT_MAX_CONTRIBUTION,
  buildOrderedQuestions,
  buildScoringRules,
} = require('./data/axis-model-v2')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Eksik kimlik bilgisi: .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_KEY gerekli.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const shouldActivate = process.argv.includes('--activate')

/** Hata varsa fırlatır, yoksa veriyi döner. */
function unwrap({ data, error }, context) {
  if (error) {
    throw new Error(`${context}: ${error.message}`)
  }
  return data
}

/** v2 eksen modelini bulur, yoksa pasif olarak oluşturur. */
async function ensureAxisModel() {
  const existing = unwrap(
    await supabase.from('axis_models').select('*').eq('version', AXIS_MODEL.version).maybeSingle(),
    'axis_models okunamadı'
  )

  if (existing) {
    return existing
  }

  return unwrap(
    await supabase
      .from('axis_models')
      .insert({ name: AXIS_MODEL.name, version: AXIS_MODEL.version, is_active: false })
      .select()
      .single(),
    'axis_models oluşturulamadı'
  )
}

/** 8 ekseni slug üzerinden upsert eder, slug -> id eşlemesi döner. */
async function upsertAxes(axisModelId) {
  const rows = AXES.map((axis) => ({ ...axis, axis_model_id: axisModelId }))

  const saved = unwrap(
    await supabase.from('axes').upsert(rows, { onConflict: 'slug' }).select('id, slug'),
    'axes yazılamadı'
  )

  return new Map(saved.map((axis) => [axis.slug, axis.id]))
}

/**
 * Bir maddeyi upsert eder ve seçenek + puanlama kurallarını yeniden yazar.
 * Seçenek/kurallar tam olarak değiştirilir; kısmi güncelleme yerine sil-yaz,
 * çünkü içerik dosyası tek doğruluk kaynağıdır.
 */
async function upsertQuestion(question, axisModelId, axisIdBySlug) {
  const existing = unwrap(
    await supabase
      .from('questions')
      .select('id')
      .eq('axis_model_id', axisModelId)
      .eq('code', question.code)
      .maybeSingle(),
    `questions okunamadı (${question.code})`
  )

  const payload = {
    axis_model_id: axisModelId,
    code: question.code,
    text: question.text,
    description: question.description ?? null,
    type: question.type,
    required: false,
    order_index: question.order_index,
    is_scored: question.is_scored,
    weight: 1.0,
    max_contribution: question.is_scored ? LIKERT_MAX_CONTRIBUTION : null,
    expected_value: question.expected_value ?? null,
  }

  const saved = existing
    ? unwrap(
        await supabase.from('questions').update(payload).eq('id', existing.id).select('id').single(),
        `questions güncellenemedi (${question.code})`
      )
    : unwrap(
        await supabase.from('questions').insert(payload).select('id').single(),
        `questions eklenemedi (${question.code})`
      )

  const questionId = saved.id

  unwrap(
    await supabase.from('question_options').delete().eq('question_id', questionId),
    `question_options temizlenemedi (${question.code})`
  )
  unwrap(
    await supabase.from('scoring_rules').delete().eq('question_id', questionId),
    `scoring_rules temizlenemedi (${question.code})`
  )

  unwrap(
    await supabase.from('question_options').insert(
      LIKERT_OPTIONS.map((option, index) => ({
        question_id: questionId,
        text: option.text,
        value: option.value,
        order_index: index + 1,
      }))
    ),
    `question_options yazılamadı (${question.code})`
  )

  if (!question.is_scored) {
    return { questionId, ruleCount: 0 }
  }

  const axisId = axisIdBySlug.get(question.axis)
  if (!axisId) {
    throw new Error(`${question.code}: "${question.axis}" ekseni bulunamadı`)
  }

  const rules = buildScoringRules(question).map((rule) => ({
    question_id: questionId,
    axis_id: axisId,
    answer_value: rule.answer_value,
    score_modifier: rule.score_modifier,
  }))

  unwrap(await supabase.from('scoring_rules').insert(rules), `scoring_rules yazılamadı (${question.code})`)

  return { questionId, ruleCount: rules.length }
}

/** v2'yi aktif, diğer tüm modelleri pasif yapar. */
async function activate(axisModelId) {
  unwrap(
    await supabase.from('axis_models').update({ is_active: false }).neq('id', axisModelId),
    'diğer modeller pasifleştirilemedi'
  )
  unwrap(
    await supabase.from('axis_models').update({ is_active: true }).eq('id', axisModelId),
    'v2 aktifleştirilemedi'
  )
}

async function main() {
  const axisModel = await ensureAxisModel()
  console.log(`Eksen modeli: ${axisModel.name} (${axisModel.id}) — aktif: ${axisModel.is_active}`)

  const axisIdBySlug = await upsertAxes(axisModel.id)
  console.log(`${axisIdBySlug.size} eksen yazıldı.`)

  const questions = buildOrderedQuestions()
  let ruleTotal = 0

  for (const question of questions) {
    const { ruleCount } = await upsertQuestion(question, axisModel.id, axisIdBySlug)
    ruleTotal += ruleCount
  }

  console.log(`${questions.length} soru yazıldı (${questions.filter((q) => q.is_scored).length} puanlanan).`)
  console.log(`${ruleTotal} puanlama kuralı yazıldı.`)

  if (shouldActivate) {
    await activate(axisModel.id)
    console.log('v2 AKTİF edildi. Anket artık v2 soru setini gösterecek.')
  } else {
    console.log('v2 pasif bırakıldı. Devreye almak için: node scripts/seed-axis-model-v2.js --activate')
  }
}

main().catch((error) => {
  console.error('Seed başarısız:', error.message)
  process.exit(1)
})
