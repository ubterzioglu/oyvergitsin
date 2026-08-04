// Anket akışını uçtan uca çalıştırır: oturum aç -> soruları çek -> cevapla ->
// tamamla -> sonucu doğrula. Çalışan bir sunucuya HTTP ile bağlanır.
//
//   node scripts/smoke-survey-flow.js                       # http://localhost:3000
//   BASE_URL=https://... node scripts/smoke-survey-flow.js
//
// Oturum sahipliği çerezle doğrulandığı için çerezler istekler arasında taşınır.

require('dotenv').config({ path: '.env.local' })

const { assertSafeTestTarget } = require('./test-write-guard')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
assertSafeTestTarget(BASE_URL)

let cookieJar = ''

async function call(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieJar ? { cookie: cookieJar } : {}),
      ...options.headers,
    },
  })

  const setCookie = response.headers.getSetCookie?.() ?? []
  if (setCookie.length > 0) {
    cookieJar = setCookie.map((entry) => entry.split(';')[0]).join('; ')
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(`${path} -> ${response.status}: ${JSON.stringify(body)}`)
  }

  return body
}

function assert(condition, message) {
  if (!condition) throw new Error(`BAŞARISIZ: ${message}`)
  console.log(`OK    ${message}`)
}

/**
 * Tutarlı biçimde eksenlerin +100 ucunda duran bir profil üretir: düz
 * kodlanmış maddelerde "kesinlikle katılıyorum", ters kodlanmış maddelerde
 * "kesinlikle katılmıyorum". Ters kodlama doğru çalışıyorsa her eksen +100
 * vermelidir; çalışmıyorsa skorlar sıfıra yakın çıkar.
 *
 * İlk madde kasıtlı olarak "fikrim yok" bırakılır (kapsama testi), ikincisi
 * "önemli" işaretlenir (lambda testi).
 */
function buildAnswers(questions) {
  const { QUESTIONS } = require('./data/axis-model-v2')
  const reversedByCode = new Map(QUESTIONS.map((item) => [item.code, item.reversed]))

  return questions
    .filter((question) => question.type === 'likert_5')
    .map((question, index) => {
      if (index === 0) {
        return { questionId: question.id, value: 'no_opinion', isImportant: false }
      }

      return {
        questionId: question.id,
        value: reversedByCode.get(question.code) ? 'strongly_disagree' : 'strongly_agree',
        isImportant: index === 1,
      }
    })
}

async function main() {
  console.log(`Hedef: ${BASE_URL}\n`)

  const health = await call('/api/health')
  assert(health.status === 'healthy', 'sağlık kontrolü geçti')

  const questionsPayload = await call('/api/questions')
  const questions = questionsPayload.questions ?? []
  assert(questions.length === 25, `25 soru döndü (gelen: ${questions.length})`)

  const likert = questions.filter((question) => question.type === 'likert_5')
  assert(likert.length === 24, `24 Likert maddesi var (gelen: ${likert.length})`)

  const attention = questions.filter((question) => question.type === 'attention_check')
  assert(attention.length === 1, 'bir dikkat kontrolü maddesi var')

  const withNoOpinion = likert.filter((question) =>
    (question.question_options ?? []).some((option) => option.value === 'no_opinion')
  )
  assert(withNoOpinion.length === 24, 'her Likert maddesinde "fikrim yok" seçeneği var')

  const session = await call('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ isGuest: true }),
  })
  const sessionId = session.sessionId ?? session.id
  assert(Boolean(sessionId), `oturum açıldı (${sessionId})`)

  const answers = buildAnswers(questions)
  await call('/api/answers', {
    method: 'POST',
    body: JSON.stringify({ sessionId, answers }),
  })
  assert(true, `${answers.length} cevap kaydedildi`)

  const completed = await call('/api/complete', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  })
  assert(completed.algorithmVersion === 2, 'sonuç v2 algoritmasıyla üretildi')

  const results = await call(`/api/results/${sessionId}`)
  const axes = results.axes ?? []
  const parties = results.parties ?? []

  assert(axes.length === 8, `8 eksen döndü (gelen: ${axes.length})`)

  const scoredAxes = axes.filter((axis) => axis.score !== null)
  assert(scoredAxes.length === 8, 'tüm eksenlerde skor üretildi')

  // Tam yanıtlanan 7 eksende tutarlı uç profil +100 vermeli; "fikrim yok"
  // verilen eksen 2 maddeye dayandığı için yine +100 çıkar ama kapsaması düşer.
  const saturated = scoredAxes.filter((axis) => axis.score === 100)
  assert(saturated.length === 8, `ters kodlama doğru: 8 eksen de +100 (gelen: ${saturated.length})`)

  const partialAxis = axes.find((axis) => axis.answeredItems < axis.totalItems)
  assert(Boolean(partialAxis), '"fikrim yok" verilen eksende kapsama düştü')
  assert(
    partialAxis.tier === 'medium',
    `kısmi eksen "orta" kapsama etiketi aldı (${partialAxis.tier}, ${partialAxis.answeredItems}/${partialAxis.totalItems})`
  )

  const ranked = parties.filter((party) => party.similarity !== null)
  const unranked = parties.filter((party) => party.similarity === null)

  // Beklenen sıralı parti sayısı kaynak veriden türetilir: yeterli eksende
  // konumlanmış partiler sıralanır, azı kodlanmış olanlar sıralama dışı kalır.
  const { deriveAllPositions } = require('./data/party-positions-v2')
  const axisCountByParty = new Map()
  for (const row of deriveAllPositions()) {
    axisCountByParty.set(row.shortName, (axisCountByParty.get(row.shortName) ?? 0) + 1)
  }
  const required = Math.ceil(0.75 * axes.length)
  const expectedRanked = [...axisCountByParty.values()].filter((count) => count >= required).length

  assert(
    ranked.length === expectedRanked,
    `${expectedRanked} parti sıralandı (gelen: ${ranked.length})`
  )
  assert(
    unranked.length > 0,
    `${unranked.length} parti sıralama dışı (konum yok ya da yetersiz eksen)`
  )
  assert(
    ranked.every((party) => party.similarity >= 0 && party.similarity <= 100),
    'tüm benzerlikler [0, 100] aralığında'
  )
  assert(
    ranked.every((party, index) => index === 0 || ranked[index - 1].similarity >= party.similarity),
    'partiler benzerliğe göre azalan sırada'
  )

  const top = ranked[0]
  assert(top.agreements.length > 0, `"neden bu sonuç" verisi dolu (${top.partyShortName})`)
  assert(top.disagreements.length > 0, 'ayrışan konular listesi dolu')

  const weighted = axes.filter((axis) => axis.excludedFromMatching === false)
  assert(weighted.length === 8, 'düşük kapsamalı eksen yok, hepsi eşleşmeye dahil')

  console.log('\nSonuç sıralaması:')
  for (const party of ranked) {
    console.log(`  %${String(party.similarity).padStart(3)}  ${party.partyName}`)
  }

  console.log('\nEksen skorları:')
  for (const axis of axes) {
    console.log(
      `  ${String(axis.score).padStart(5)}  ${axis.axisName} (${axis.answeredItems}/${axis.totalItems}, ${axis.tier})`
    )
  }

  await checkLegacySnapshot(sessionId)

  console.log('\nTüm kontroller geçti.')
}

/**
 * Eski metodoloji sürümüyle kaydedilmiş sonuçların hâlâ açılabildiğini
 * doğrular. v1 snapshot'ları yalnızca id -> skor eşlemesi tutar; sonuç
 * sayfası bunları yeniden hesaplamadan, "önceki sürüm" notuyla göstermelidir.
 */
async function checkLegacySnapshot(sessionId) {
  console.log('\nEski sürüm snapshot regresyonu:')

  const { Client } = require('pg')
  const client = new Client({ connectionString: process.env.DBLINK, ssl: { rejectUnauthorized: false } })
  await client.connect()

  try {
    const v1 = await client.query(
      `select a.id from axes a join axis_models m on m.id = a.axis_model_id
       where m.version = 'v1' order by a.order_index limit 3`
    )
    const parties = await client.query('select id from parties limit 2')

    if (v1.rowCount === 0 || parties.rowCount === 0) {
      console.log('      v1 ekseni ya da parti bulunamadı, atlandı.')
      return
    }

    const axisScores = Object.fromEntries(v1.rows.map((row, index) => [row.id, 40 - index * 25]))
    const partySimilarities = Object.fromEntries(parties.rows.map((row, index) => [row.id, 70 - index * 10]))

    await client.query(
      `update result_snapshots
       set axis_scores = $2, party_similarities = $3, algorithm_version = 1,
           result_payload = null, axis_coverage = null, quality_flags = null
       where session_id = $1`,
      [sessionId, axisScores, partySimilarities]
    )
  } finally {
    await client.end()
  }

  const legacy = await call(`/api/results/${sessionId}`)

  assert(legacy.algorithmVersion === 1, 'eski snapshot "sürüm 1" olarak işaretlendi')
  assert(Array.isArray(legacy.axes) && legacy.axes.length === 3, 'eski eksenler adlarıyla çözüldü')
  assert(Array.isArray(legacy.parties) && legacy.parties.length === 2, 'eski partiler adlarıyla çözüldü')
  assert(
    legacy.axes.every((axis) => typeof axis.axisName === 'string' && axis.axisName.length > 0),
    'eksen adları boş değil'
  )
  assert(
    legacy.parties.every((party) => Array.isArray(party.agreements)),
    'eksik açıklama alanları boş dizi olarak geldi (sayfa çökmez)'
  )
}

main().catch((error) => {
  console.error(`\n${error.message}`)
  process.exit(1)
})
