require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper to generate UUID
const generateId = () => crypto.randomUUID()

async function seed() {
  console.log('Starting database seed...')

  try {
    // 1. Create roles
    console.log('Creating roles...')
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .upsert([
        { id: generateId(), name: 'admin' },
        { id: generateId(), name: 'user' }
      ])
      .select()

    if (rolesError) throw rolesError
    const adminRoleId = roles.find(r => r.name === 'admin')?.id

    // 2. Create axis model
    console.log('Creating axis model...')
    const { data: axisModel, error: axisModelError } = await supabase
      .from('axis_models')
      .insert({
        id: generateId(),
        name: 'Türkiye Siyasi Eksen Modeli v1',
        version: 'v1',
        is_active: true
      })
      .select()
      .single()

    if (axisModelError) throw axisModelError
    const axisModelId = axisModel.id

    // 3. Create axes
    console.log('Creating axes...')
    const axesData = [
      { name: 'Ekonomi: Piyasa vs Devlet', description: 'Ekonomik kararların piyasa mekanizmaları mı yoksa devlet müdahalesi mi ile yönetilmesi gerektiği', slug: 'economy_market_state', order_index: 1 },
      { name: 'Gelir Dağılımı', description: 'Gelir ve servetin dağılımı ile ilgili bakış açısı', slug: 'income_distribution', order_index: 2 },
      { name: 'Sivil Özgürlükler', description: 'Bireysel özgürlüklerin devlet otoritesi ile denge', slug: 'civil_liberties', order_index: 3 },
      { name: 'Güvenlik ve Devlet', description: 'Milli güvenlik öncelikleri ve devletin rolü', slug: 'security_state', order_index: 4 },
      { name: 'Sekülerizm', description: 'Din ve devlet ilişkisi', slug: 'secularism', order_index: 5 },
      { name: 'Kimlik ve Göç', description: 'Ulusal kimlik ve göç politikaları', slug: 'identity_migration', order_index: 6 },
      { name: 'Dış Politika', description: 'Uluslararası ilişkiler ve dış politika yaklaşımı', slug: 'foreign_policy', order_index: 7 },
      { name: 'AB İlişkileri', description: 'Avrupa Birliği ile ilişkiler ve uyum süreci', slug: 'eu_relations', order_index: 8 },
      { name: 'Eğitim ve Sosyal Politika', description: 'Eğitim sistemi ve sosyal politikalar', slug: 'education_social_policy', order_index: 9 },
      { name: 'Çevre ve Kalkınma', description: 'Çevre koruma ve ekonomik kalkınma dengesi', slug: 'environment_growth', order_index: 10 }
    ]

    const { data: axes, error: axesError } = await supabase
      .from('axes')
      .insert(axesData.map(axis => ({
        ...axis,
        id: generateId(),
        axis_model_id: axisModelId
      })))
      .select()

    if (axesError) throw axesError

    // 4. Create consent text
    console.log('Creating consent text...')
    await supabase
      .from('consent_texts')
      .insert({
        id: generateId(),
        version: 1,
        text: `Bu anket, siyasi görüşlerinizi analiz etmek ve size en yakın partileri göstermek amacıyla tasarlanmıştır.

• Cevaplarınız anonim olarak işlenecektir.
• Verileriniz sadece analiz amaçlı kullanılacaktır.
• Kişisel bilgileriniz asla üçüncü şahıslarla paylaşılmayacaktır.
• İstediğiniz zaman anketi durdurabilirsiniz.

Devam ederek yukarıdaki koşulları kabul etmiş sayılırsınız.`,
        is_active: true
      })

    // 5. Create parties with Turkish party colors
    console.log('Creating parties...')
    const partiesData = [
      { name: 'Adalet ve Kalkınma Partisi', short_name: 'AKP', color: '#F7941D', description: 'Muhafazakar, demokratik bir partidir.' },
      { name: 'Cumhuriyet Halk Partisi', short_name: 'CHP', color: '#E30A17', description: 'Kemalist, sosyal demokrat bir partidir.' },
      { name: 'Milliyetçi Hareket Partisi', short_name: 'MHP', color: '#F2B705', description: 'Ulusalcı, muhafazakar bir partidir.' },
      { name: 'İYİ Parti', short_name: 'İYİ', color: '#0B1F3A', description: 'Merkezcilik ve milliyetçiliği birleştiren partidir.' },
      { name: 'Demokrasi ve Atılım Partisi', short_name: 'DEVA', color: '#7A3DB8', description: 'Merkezcilik ve atılımı savunan partidir.' },
      { name: 'Gelecek Partisi', short_name: 'Gelecek', color: '#1B6FB3', description: 'Merkezcilik ve gelecek vizyonu ön plandadır.' },
      { name: 'Saadet Partisi', short_name: 'Saadet', color: '#6A1BB3', description: 'Milli Görüş çizgisinde bir partidir.' },
      { name: 'Türkiye İşçi Partisi', short_name: 'TİP', color: '#333333', description: 'Sosyalist bir partidir.' },
      { name: 'Vatan Partisi', short_name: 'Vatan', color: '#D10F2F', description: 'Yurtsever, solcu bir partidir.' },
      { name: 'Yeşil Sol Parti', short_name: 'YSP', color: '#0F7A3A', description: 'Yeşil ve sol değerleri savunan partidir.' },
      { name: 'Zafar Partisi', short_name: 'Zafer', color: '#00964C', description: 'Milliyetçi bir partidir.' },
      { name: 'Memleket Partisi', short_name: 'Memleket', color: '#FDD007', description: 'Merkezcilik ön plandadır.' }
    ]

    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .insert(partiesData.map(party => ({
        ...party,
        id: generateId()
      })))
      .select()

    if (partiesError) throw partiesError

    // 6. Create dummy party positions
    console.log('Creating party positions...')
    const partyPositions = []
    parties.forEach(party => {
      axes.forEach(axis => {
        partyPositions.push({
          id: generateId(),
          party_id: party.id,
          axis_id: axis.id,
          score: Math.floor(Math.random() * 201) - 100 // Random -100 to 100
        })
      })
    })

    const { error: positionsError } = await supabase
      .from('party_positions')
      .insert(partyPositions)

    if (positionsError) throw positionsError

    // 7. Create sample questions (one of each type)
    console.log('Creating questions...')
    const questionsData = [
      // single_choice
      { text: 'Ekonomik kararların kim tarafından alınması gerektiğini düşünüyorsunuz?', type: 'single_choice', description: 'Ekonomik yönetim tercihinizi belirleyin', required: true, order_index: 1 },
      // multi_choice
      { text: 'Hangi sosyal politikaları destekliyorsunuz? (Birden fazla seçebilirsiniz)', type: 'multi_choice', description: 'Desteklediğiniz sosyal politikaları seçin', required: true, order_index: 2 },
      // dropdown_single
      { text: 'Eğitim sisteminde hangi modeli tercih edersiniz?', type: 'dropdown_single', description: 'Eğitim modeli tercihinizi seçin', required: true, order_index: 3 },
      // dropdown_multi
      { text: 'Dış politikada öncelik verdiğiniz alanlar nelerdir?', type: 'dropdown_multi', description: 'Öncelik verdiğiniz dış politika alanlarını seçin', required: false, order_index: 4 },
      // ranking
      { text: 'Aşağıdaki konuları önem sırasına göre sıralayın:', type: 'ranking', description: 'Önem sırasını belirleyin', required: true, order_index: 5 },
      // forced_choice_pair
      { text: 'Hangisini tercih edersiniz?', type: 'forced_choice_pair', description: 'İkiden birini seçin', required: true, order_index: 6 },
      // matrix_single
      { text: 'Aşağıdaki konularda ne kadar hemfikirsiniz?', type: 'matrix_single', description: 'Her konu için seçim yapın', required: true, order_index: 7 },
      // matrix_multi
      { text: 'Hangi önerileri destekliyorsunuz? (Birden fazla seçebilirsiniz)', type: 'matrix_multi', description: 'Her konu için seçim yapın', required: false, order_index: 8 },
      // likert_5
      { text: 'Devletin ekonomiye müdahalesi gerekli midir?', type: 'likert_5', description: '5 noktalı Likert ölçeği', required: true, order_index: 9 },
      // likert_7
      { text: 'Dini referansların yasama süreçlerinde yer alması ne kadar doğrudur?', type: 'likert_7', description: '7 noktalı Likert ölçeği', required: true, order_index: 10 },
      // slider_0_100
      { text: 'Göç politikasında kısıtlama seviyesini belirleyin:', type: 'slider_0_100', description: '0=Hiç kısıtlama yok, 100=Tam kısıtlama', required: true, order_index: 11 },
      // numeric_input
      { text: 'Gelir vergisinin üst sınırı ne kadar olmalıdır? (Yüzde olarak)', type: 'numeric_input', description: '0-100 arası bir değer girin', required: true, order_index: 12 },
      // allocation
      { text: 'Bütçe dağılımını yapın (Toplam 100 puan):', type: 'allocation', description: 'Toplam 100 puanı alanlara dağıtın', required: true, order_index: 13 },
      // scenario_single
      { text: 'Ekonomik kriz durumunda ne yapılmalıdır?', type: 'scenario_single', description: 'Senaryo tabanlı soru', required: true, order_index: 14 },
      // scenario_multi
      { text: 'Hangi önlemler alınmalıdır? (Birden fazla seçebilirsiniz)', type: 'scenario_multi', description: 'Senaryo tabanlı çoklu seçim', required: false, order_index: 15 },
      // vignette_likert
      { text: 'Okuduğunuz durumu ne kadar doğru buluyorsunuz?', type: 'vignette_likert', description: 'Vignette ile Likert değerlendirmesi', required: true, order_index: 16 },
      // open_text_short
      { text: 'En önemli siyasi önceliğiniz nedir?', type: 'open_text_short', description: 'Kısa metin girişi', required: false, order_index: 17 },
      // open_text_long
      { text: 'Siyasi görüşlerinizi detaylı olarak açıklayın:', type: 'open_text_long', description: 'Uzun metin girişi', required: false, order_index: 18 },
      // image_choice_single
      { text: 'Hangi sembolü tercih edersiniz?', type: 'image_choice_single', description: 'Görsel seçim', required: true, order_index: 19 },
      // image_choice_multi
      { text: 'Hangi görselleri tanıyorsunuz? (Birden fazla seçebilirsiniz)', type: 'image_choice_multi', description: 'Görsel çoklu seçim', required: false, order_index: 20 },
      // file_upload
      { text: 'Fotoğraf yükleyin:', type: 'file_upload', description: 'Dosya yükleme', required: false, order_index: 21 },
      // date_input
      { text: 'Seçim tarihi ne olmalı?', type: 'date_input', description: 'Tarih seçimi', required: true, order_index: 22 },
      // consent_checkbox_group
      { text: 'Aşağıdaki onayları işaretleyiniz:', type: 'consent_checkbox_group', description: 'Gerekli onaylar', required: true, order_index: 23 },
      // attention_check
      { text: 'Dikkat kontrolü için "Evet"i seçin:', type: 'attention_check', description: 'Dikkat kontrolü', required: true, order_index: 24 },
      // captcha_placeholder
      { text: 'Güvenlik kontrolü:', type: 'captcha_placeholder', description: 'CAPTCHA kontrolü', required: true, order_index: 25 }
    ]

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .insert(questionsData.map(q => ({
        ...q,
        id: generateId()
      })))
      .select()

    if (questionsError) throw questionsError

    // 8. Create question options for sample questions
    console.log('Creating question options...')
    const questionOptions = []

    // Options for question 1 (single_choice - economy)
    const q1 = questions.find(q => q.order_index === 1)
    if (q1) {
      questionOptions.push(
        { question_id: q1.id, text: 'Piyasa mekanizmaları', value: 'market', order_index: 1 },
        { question_id: q1.id, text: 'Devlet müdahalesi', value: 'state', order_index: 2 },
        { question_id: q1.id, text: 'Karma model', value: 'mixed', order_index: 3 }
      )
    }

    // Options for question 2 (multi_choice - social policies)
    const q2 = questions.find(q => q.order_index === 2)
    if (q2) {
      questionOptions.push(
        { question_id: q2.id, text: 'Ücretsiz sağlık hizmetleri', value: 'free_healthcare', order_index: 1 },
        { question_id: q2.id, text: 'Evrensel eğitim hakkı', value: 'universal_education', order_index: 2 },
        { question_id: q2.id, text: 'Sosyal yardımların genişletilmesi', value: 'social_welfare', order_index: 3 },
        { question_id: q2.id, text: 'Asgari ücret artışı', value: 'minimum_wage', order_index: 4 }
      )
    }

    // Options for question 9 (likert_5)
    const q9 = questions.find(q => q.order_index === 9)
    if (q9) {
      questionOptions.push(
        { question_id: q9.id, text: 'Kesinlikle katılmıyorum', value: 'strongly_disagree', order_index: 1 },
        { question_id: q9.id, text: 'Katılmıyorum', value: 'disagree', order_index: 2 },
        { question_id: q9.id, text: 'Kararsızım', value: 'neutral', order_index: 3 },
        { question_id: q9.id, text: 'Katılıyorum', value: 'agree', order_index: 4 },
        { question_id: q9.id, text: 'Kesinlikle katılıyorum', value: 'strongly_agree', order_index: 5 }
      )
    }

    const { error: optionsError } = await supabase
      .from('question_options')
      .insert(questionOptions.map(opt => ({
        ...opt,
        id: generateId()
      })))

    if (optionsError) throw optionsError

    // 9. Create scoring rules for sample questions
    console.log('Creating scoring rules...')
    const scoringRules = []
    const economyAxis = axes.find(a => a.slug === 'economy_market_state')
    const socialAxis = axes.find(a => a.slug === 'education_social_policy')
    const secularAxis = axes.find(a => a.slug === 'secularism')

    if (q1 && economyAxis) {
      scoringRules.push(
        { question_id: q1.id, answer_value: 'market', axis_id: economyAxis.id, score_modifier: 50 },
        { question_id: q1.id, answer_value: 'state', axis_id: economyAxis.id, score_modifier: -50 },
        { question_id: q1.id, answer_value: 'mixed', axis_id: economyAxis.id, score_modifier: 0 }
      )
    }

    if (q2 && socialAxis) {
      scoringRules.push(
        { question_id: q2.id, answer_value: 'free_healthcare', axis_id: socialAxis.id, score_modifier: -30 },
        { question_id: q2.id, answer_value: 'universal_education', axis_id: socialAxis.id, score_modifier: -30 },
        { question_id: q2.id, answer_value: 'social_welfare', axis_id: socialAxis.id, score_modifier: -30 },
        { question_id: q2.id, answer_value: 'minimum_wage', axis_id: socialAxis.id, score_modifier: -30 }
      )
    }

    if (q9 && economyAxis) {
      scoringRules.push(
        { question_id: q9.id, answer_value: 'strongly_disagree', axis_id: economyAxis.id, score_modifier: 50 },
        { question_id: q9.id, answer_value: 'disagree', axis_id: economyAxis.id, score_modifier: 25 },
        { question_id: q9.id, answer_value: 'neutral', axis_id: economyAxis.id, score_modifier: 0 },
        { question_id: q9.id, answer_value: 'agree', axis_id: economyAxis.id, score_modifier: -25 },
        { question_id: q9.id, answer_value: 'strongly_agree', axis_id: economyAxis.id, score_modifier: -50 }
      )
    }

    const { error: scoringError } = await supabase
      .from('scoring_rules')
      .insert(scoringRules.map(rule => ({
        ...rule,
        id: generateId()
      })))

    if (scoringError) throw scoringError

    console.log('✅ Database seed completed successfully!')
    console.log(`- Created ${roles?.length || 0} roles`)
    console.log(`- Created ${axes?.length || 0} axes`)
    console.log(`- Created ${parties?.length || 0} parties`)
    console.log(`- Created ${questions?.length || 0} questions`)
    console.log(`- Created ${questionOptions.length} question options`)
    console.log(`- Created ${scoringRules.length} scoring rules`)

  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seed()
