/**
 * Anket sağlık kontrolü.
 *
 * 1) /api/questions çıktısındaki her soruyu, /survey ekranının render
 *    kurallarına göre denetler: hiçbir soru boş gövdeyle çıkmamalı ve
 *    zorunlu sorular cevaplanabilir olmalı.
 * 2) --e2e verilirse tüm soruları programatik cevaplayıp oturumu
 *    tamamlar ve sonuç sayfasının veri döndürdüğünü doğrular.
 *
 * Kullanım:
 *   node scripts/audit-questions.js [baseUrl] [--e2e]
 *   (varsayılan baseUrl: http://localhost:3000)
 */

const baseUrl = (process.argv.find((a) => a.startsWith('http')) || 'http://localhost:3000').replace(/\/$/, '')
const runE2E = process.argv.includes('--e2e')

// app/survey/page.tsx içindeki switch ile aynı sınıflandırma.
const SINGLE_SELECT_TYPES = new Set([
  'single_choice',
  'forced_choice_pair',
  'attention_check',
  'scenario_single',
  'dropdown_single',
  'likert_5',
  'likert_7',
  'vignette_likert',
  'image_choice_single',
])

const MULTI_SELECT_TYPES = new Set([
  'multi_choice',
  'dropdown_multi',
  'scenario_multi',
  'image_choice_multi',
  'consent_checkbox_group',
])

const MATRIX_TYPES = new Set(['matrix_single', 'matrix_multi'])

// Seçenek gerektirmeyen, kendi girdisini render eden tipler.
const STANDALONE_TYPES = new Set([
  'slider_0_100',
  'numeric_input',
  'open_text_short',
  'open_text_long',
  'date_input',
  'file_upload',
  'captcha_placeholder',
])

function splitMatrixOptions(options) {
  return {
    rows: options.filter((o) => o.value.startsWith('row:')).map((o) => ({ ...o, value: o.value.slice(4) })),
    columns: options.filter((o) => o.value.startsWith('col:')).map((o) => ({ ...o, value: o.value.slice(4) })),
  }
}

/** Sorunun /survey'de görünür bir gövde üretip üretmediğini döndürür. */
function inspectRender(question) {
  const options = question.question_options || []
  const type = question.type

  if (STANDALONE_TYPES.has(type)) {
    return { ok: true, detail: 'kendi girdisini render eder' }
  }

  if (MATRIX_TYPES.has(type)) {
    const { rows, columns } = splitMatrixOptions(options)
    if (!rows.length || !columns.length) {
      return { ok: false, detail: `matris eksik (satır=${rows.length}, sütun=${columns.length})` }
    }
    return { ok: true, detail: `${rows.length} satır x ${columns.length} sütun` }
  }

  if (!options.length) {
    const known = SINGLE_SELECT_TYPES.has(type) || MULTI_SELECT_TYPES.has(type) || type === 'ranking' || type === 'allocation'
    return { ok: false, detail: known ? 'seçenek yok' : `bilinmeyen tip "${type}" ve seçenek yok` }
  }

  return { ok: true, detail: `${options.length} seçenek` }
}

/** Soru tipine uygun geçerli bir cevap üretir (E2E için). */
function buildAnswer(question) {
  const options = question.question_options || []
  const values = options.map((o) => o.value)
  const type = question.type

  if (MATRIX_TYPES.has(type)) {
    const { rows, columns } = splitMatrixOptions(options)
    const answer = {}
    rows.forEach((row) => {
      answer[row.value] = type === 'matrix_multi' ? columns.slice(0, 2).map((c) => c.value) : [columns[0].value]
    })
    return JSON.stringify(answer)
  }

  if (type === 'allocation') {
    const answer = {}
    const share = Math.floor(100 / values.length)
    values.forEach((v, i) => {
      answer[v] = i === values.length - 1 ? 100 - share * (values.length - 1) : share
    })
    return JSON.stringify(answer)
  }

  if (type === 'ranking') return values.join(',')
  if (MULTI_SELECT_TYPES.has(type)) return JSON.stringify(values.slice(0, Math.max(1, Math.min(2, values.length))))
  if (type === 'slider_0_100') return '50'
  if (type === 'numeric_input') return '40'
  if (type === 'open_text_short') return 'Ekonomi'
  if (type === 'open_text_long') return 'Otomatik denetim tarafından üretilmiş test cevabı.'
  if (type === 'date_input') return '2026-11-01'
  if (type === 'file_upload') return 'audit.png'
  if (type === 'captcha_placeholder') return 'confirmed'

  return values[0] ?? ''
}

async function fetchQuestions() {
  const res = await fetch(`${baseUrl}/api/questions`, { cache: 'no-store' })
  const payload = await res.json()
  if (!res.ok) throw new Error(payload.error || `GET /api/questions -> ${res.status}`)
  return payload.questions || []
}

async function auditRendering(questions) {
  console.log(`\n=== RENDER DENETİMİ (${questions.length} soru) ===`)
  const failures = []

  for (const question of questions) {
    const result = inspectRender(question)
    const status = result.ok ? 'OK  ' : 'BOŞ '
    console.log(
      `${status} #${String(question.order_index).padStart(2)} [${question.type}]` +
        `${question.required ? ' *' : '  '} ${result.detail}`
    )
    if (!result.ok) failures.push({ question, result })
  }

  return failures
}

async function runEndToEnd(questions) {
  console.log('\n=== UÇTAN UCA AKIŞ ===')

  const sessionRes = await fetch(`${baseUrl}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isGuest: true }),
  })
  const sessionPayload = await sessionRes.json()
  if (!sessionRes.ok) throw new Error(sessionPayload.error || `POST /api/sessions -> ${sessionRes.status}`)

  // Oturum sahipliği çerezle doğrulanıyor; sonraki isteklerde geri gönderilmeli.
  const cookie = (sessionRes.headers.getSetCookie?.() || [])
    .map((c) => c.split(';')[0])
    .join('; ')
  const sessionId = sessionPayload.sessionId
  console.log(`OK   oturum oluşturuldu: ${sessionId}`)

  const answers = questions.map((question) => ({
    questionId: question.id,
    value: buildAnswer(question),
  }))

  const tooLong = answers.filter((a) => a.value.length > 500 || a.value.length === 0)
  if (tooLong.length) {
    throw new Error(`Geçersiz cevap uzunluğu: ${tooLong.length} soru (0 veya >500 karakter)`)
  }

  const answersRes = await fetch(`${baseUrl}/api/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ sessionId, answers }),
  })
  const answersPayload = await answersRes.json().catch(() => ({}))
  if (!answersRes.ok) throw new Error(answersPayload.error || `POST /api/answers -> ${answersRes.status}`)
  console.log(`OK   ${answers.length} cevap kaydedildi`)

  const completeRes = await fetch(`${baseUrl}/api/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ sessionId }),
  })
  const completePayload = await completeRes.json().catch(() => ({}))
  if (!completeRes.ok) throw new Error(completePayload.error || `POST /api/complete -> ${completeRes.status}`)
  console.log('OK   oturum tamamlandı')

  const resultsRes = await fetch(`${baseUrl}/api/results/${sessionId}`, { headers: { cookie } })
  const resultsPayload = await resultsRes.json().catch(() => ({}))
  if (!resultsRes.ok) throw new Error(resultsPayload.error || `GET /api/results -> ${resultsRes.status}`)

  // Sonuç sayfası axes/parties dizilerini map ettiği için yanıtın yalnızca
  // skor sözlüklerini içermesi sayfayı çökertir; şeklin tamamı doğrulanır.
  const axisCount = Object.keys(resultsPayload.axisScores || {}).length
  const partyCount = Object.keys(resultsPayload.partySimilarities || {}).length
  if (!axisCount || !partyCount) {
    throw new Error(`Sonuçlar boş döndü (eksen=${axisCount}, parti=${partyCount})`)
  }

  if (!Array.isArray(resultsPayload.axes) || !Array.isArray(resultsPayload.parties)) {
    throw new Error(
      `Sonuç yanıtında dizi alanları eksik (axes=${typeof resultsPayload.axes}, parties=${typeof resultsPayload.parties})`
    )
  }
  if (!resultsPayload.axes.length || !resultsPayload.parties.length) {
    throw new Error(
      `Sonuç dizileri boş (axes=${resultsPayload.axes.length}, parties=${resultsPayload.parties.length})`
    )
  }

  const missingAxisName = resultsPayload.axes.find((a) => !a.axisName)
  const missingPartyName = resultsPayload.parties.find((p) => !p.partyName || !p.partyShortName)
  if (missingAxisName || missingPartyName) {
    throw new Error('Sonuç dizilerinde eksen/parti adı eksik')
  }

  console.log(
    `OK   sonuçlar döndü (${axisCount} eksen, ${partyCount} parti; ` +
      `axes[${resultsPayload.axes.length}], parties[${resultsPayload.parties.length}] adlarıyla dolu)`
  )
  console.log(
    `OK   en yüksek eşleşme: ${resultsPayload.parties[0].partyShortName} %${resultsPayload.parties[0].similarity}`
  )

  return resultsPayload
}

async function main() {
  const questions = await fetchQuestions()
  if (!questions.length) throw new Error('Hiç soru dönmedi.')

  const failures = await auditRendering(questions)

  if (runE2E) {
    await runEndToEnd(questions)
  }

  if (failures.length) {
    console.error(`\nFAIL: ${failures.length} soru boş render ediliyor.`)
    process.exit(1)
  }
  console.log('\nPASS: hiçbir soru boş değil.')
}

main().catch((error) => {
  console.error('\nAUDIT FAILED:', error.message)
  process.exit(1)
})
