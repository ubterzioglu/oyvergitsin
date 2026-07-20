require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Skorlar ve gerekçeler: docs/party-positions-2026-update.md
// Kaynak: yeni_deep-research-report.md (2026-07-20)
const PARTY_POSITIONS = {
  AKP: {
    economy_market_state: 55,
    income_distribution: 20,
    civil_liberties: -45,
    security_state: 60,
    secularism: 55,
    identity_migration: 40,
    foreign_policy: 60,
    eu_relations: 35,
    education_social_policy: 35,
    environment_growth: 45,
  },
  CHP: {
    economy_market_state: -25,
    income_distribution: 55,
    civil_liberties: 55,
    security_state: -15,
    secularism: -35,
    identity_migration: -30,
    foreign_policy: -25,
    eu_relations: -55,
    education_social_policy: -40,
    environment_growth: -30,
  },
  // Not: DB'de ayrı bir "HDP" short_name yok — HDP 2023 seçiminde oyları Yeşil Sol
  // Parti (YSP) listesine yönlendirdi ve raporun "HDP–Yeşil Sol hattı" analizi bu
  // nedenle YSP satırına uygulanıyor (bkz. docs/party-positions-2026-update.md).
  YSP: {
    economy_market_state: -50,
    income_distribution: 80,
    civil_liberties: 85,
    security_state: -60,
    secularism: -20,
    identity_migration: -75,
    foreign_policy: -40,
    eu_relations: -30,
    education_social_policy: -60,
    environment_growth: -85,
  },
  MHP: {
    economy_market_state: 40,
    income_distribution: 15,
    civil_liberties: -55,
    security_state: 75,
    secularism: 45,
    identity_migration: 70,
    foreign_policy: 55,
    eu_relations: 60,
    education_social_policy: 30,
    environment_growth: 25,
  },
  'İYİ': {
    economy_market_state: -35,
    income_distribution: -10,
    civil_liberties: 50,
    security_state: 10,
    secularism: 10,
    identity_migration: 20,
    foreign_policy: 15,
    eu_relations: -10,
    education_social_policy: -45,
    environment_growth: -15,
  },
  Saadet: {
    economy_market_state: 15,
    income_distribution: 45,
    civil_liberties: 40,
    security_state: 20,
    secularism: 60,
    identity_migration: 30,
    foreign_policy: 45,
    eu_relations: 20,
    education_social_policy: 20,
    environment_growth: 5,
  },
  Gelecek: {
    economy_market_state: -20,
    income_distribution: 15,
    civil_liberties: 60,
    security_state: -20,
    secularism: -15,
    identity_migration: -10,
    foreign_policy: -35,
    eu_relations: -50,
    education_social_policy: 0,
    environment_growth: -55,
  },
  DEVA: {
    economy_market_state: -45,
    income_distribution: 10,
    civil_liberties: 65,
    security_state: -25,
    secularism: -25,
    identity_migration: -20,
    foreign_policy: -30,
    eu_relations: -40,
    education_social_policy: -20,
    environment_growth: -35,
  },
}

const PARTY_DESCRIPTIONS = {
  AKP: 'Muhafazakâr-demokrat çizgide, mevcut Cumhurbaşkanlığı Hükûmet Sistemi içinde yeni anayasa arayan bir parti. 2023 seçim beyannamesi yatırım, üretim, teknoloji, savunma sanayii ve dijitalleşmeyi öncelikli dosyalar olarak öne çıkarıyor.',
  CHP: 'Sosyal demokrat çizgide, güçlendirilmiş parlamenter sisteme dönüşü, yargı bağımsızlığını ve AB tam üyelik hedefini savunuyor. Vergi adaleti, planlı kalkınma ve kurumsal restorasyon programının merkezinde yer alıyor.',
  YSP: 'HDP\'nin 2023 seçiminde oyları yönlendirdiği, çoğulculuk, halkların eşitliği, kadın özgürlüğü ve yerel demokrasi ekseninde bir parti. İklim adaleti, ademimerkeziyetçilik ve yargı reformu programının belirleyici unsurları arasında.',
  MHP: "Milliyetçi-devletçi çizgide, Cumhurbaşkanlığı Hükûmet Sistemi'nin devamını ve güçlü/merkezi bir devlet yapısını savunuyor. 2024 parti programı millî üretim, ekonomik güvenlik ve savunma-teknoloji önceliklerini vurguluyor.",
  'İYİ': 'Merkezcilik ve milliyetçiliği birleştiren, güçlendirilmiş parlamenter sistem ve kuvvetler ayrılığını savunan bir parti. Program makroekonomik istikrar, TCMB bağımsızlığı ve yerel yönetim reformuna ayrıntılı yer veriyor.',
  Saadet: "Milli Görüş geleneğini çağdaş bir siyasal programla sürdüren parti; adil hukuk düzeni, üretime dayalı ekonomi ve 'şahsiyetli dış politika' kavramlarını öne çıkarıyor. Yeni anayasa ve seçim barajının kaldırılmasını savunuyor.",
  Gelecek: 'Muhafazakâr-demokrat kökenden kurumsal restorasyon, hukukun üstünlüğü ve AB çıpasına dayalı bir sentez sunan parti. Dijital dönüşüm ve çevresel sorumluluk programının öne çıkan başlıkları arasında.',
  DEVA: 'Liberal-demokrat, piyasa dostu fakat kurumsal ve sosyal devlet boyutlarını dışlamayan bir çizgi izleyen parti. Program TCMB bağımsızlığı, şeffaflık, vergi reformu ve güçlendirilmiş parlamenter sistemi teknik ayrıntıyla ele alıyor.',
}

async function updatePartyPositions() {
  console.log('yeni_deep-research-report.md kaynaklı parti pozisyonu güncellemesi başlıyor...')

  const { data: axes, error: axesError } = await supabase.from('axes').select('id, slug')
  if (axesError) throw axesError
  const axisIdBySlug = Object.fromEntries(axes.map((axis) => [axis.slug, axis.id]))

  const { data: parties, error: partiesError } = await supabase
    .from('parties')
    .select('id, short_name')
  if (partiesError) throw partiesError
  const partyByShortName = Object.fromEntries(parties.map((party) => [party.short_name, party]))

  const coveredShortNames = Object.keys(PARTY_POSITIONS)
  const skippedShortNames = parties
    .map((party) => party.short_name)
    .filter((shortName) => !coveredShortNames.includes(shortName))

  console.log('Güncellenecek partiler:', coveredShortNames.join(', '))
  console.log(
    `Rapor kapsamı dışı, DEĞİŞTİRİLMEYECEK ${skippedShortNames.length} parti:`,
    skippedShortNames.join(', ') || '(yok)'
  )

  let upsertCount = 0
  let missingAxisWarnings = 0

  for (const shortName of coveredShortNames) {
    const party = partyByShortName[shortName]
    if (!party) {
      console.warn(`Uyarı: DB'de "${shortName}" adında parti bulunamadı, atlanıyor.`)
      continue
    }

    const axisScores = PARTY_POSITIONS[shortName]
    const rows = []

    for (const [slug, score] of Object.entries(axisScores)) {
      const axisId = axisIdBySlug[slug]
      if (!axisId) {
        console.warn(`Uyarı: "${slug}" slug'ına sahip eksen DB'de bulunamadı, atlanıyor.`)
        missingAxisWarnings += 1
        continue
      }
      rows.push({ party_id: party.id, axis_id: axisId, score })
    }

    const { error: upsertError } = await supabase
      .from('party_positions')
      .upsert(rows, { onConflict: 'party_id,axis_id' })

    if (upsertError) throw upsertError
    upsertCount += rows.length

    const description = PARTY_DESCRIPTIONS[shortName]
    if (description) {
      const { error: descriptionError } = await supabase
        .from('parties')
        .update({ description })
        .eq('id', party.id)

      if (descriptionError) throw descriptionError
    }

    console.log(`✓ ${shortName}: ${rows.length} eksen pozisyonu ve profil güncellendi.`)
  }

  console.log('✅ Parti pozisyonu güncellemesi tamamlandı.')
  console.log(`- Güncellenen satır sayısı (party_positions upsert): ${upsertCount}`)
  console.log(`- Eksik eksen uyarısı: ${missingAxisWarnings}`)
  console.log(`- Dokunulmayan parti sayısı: ${skippedShortNames.length}`)
}

updatePartyPositions().catch((error) => {
  console.error('❌ Güncelleme başarısız:', error)
  process.exit(1)
})
