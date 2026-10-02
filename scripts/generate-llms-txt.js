require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

/**
 * public/llms.txt dosyasını aktif eksen modelinden yeniden üretir.
 *
 * Neden script, neden canlıda dinamik değil: public/ altındaki statik dosya
 * route handler'ını gölgeler, ve bu projede canlıya cron bağımlılığı
 * eklememe kararı var (bkz. TBMM tazeleme). Bu yüzden içerik elle, bilinçli
 * bir komutla tazeleniyor.
 *
 * Neden hiç sayı elle yazılmıyor: dosyanın önceki hâli "10 eksen" ve
 * "12 parti" diyordu; aktif model v2 ise 8 eksen, 25 soru, 13 parti. Yanlış
 * sayı üretken arama motorlarının yanıtlarına olduğu gibi geçiyor.
 *
 * Kullanım: npm run geo:llms
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Eksik kimlik bilgisi: .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_KEY (ya da anon key) gerekli.'
  )
  process.exit(1)
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://oyvergitsin.org').replace(/\/+$/, '')
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'llms.txt')

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function loadFacts() {
  const { data: model, error: modelError } = await supabase
    .from('axis_models')
    .select('id, version')
    .eq('is_active', true)
    .single()

  if (modelError || !model) {
    throw new Error(`Aktif eksen modeli okunamadı: ${modelError ? modelError.message : 'kayıt yok'}`)
  }

  const [axesResult, questionsResult, partiesResult] = await Promise.all([
    supabase
      .from('axes')
      .select('slug, name, description')
      .eq('axis_model_id', model.id)
      .order('order_index', { ascending: true }),
    supabase.from('questions').select('id', { head: true, count: 'exact' }).eq('axis_model_id', model.id),
    supabase.from('parties').select('name, short_name').eq('is_active', true).order('name'),
  ])

  if (axesResult.error) throw axesResult.error
  if (questionsResult.error) throw questionsResult.error
  if (partiesResult.error) throw partiesResult.error

  return {
    version: model.version,
    axes: axesResult.data || [],
    questionCount: questionsResult.count || 0,
    parties: partiesResult.data || [],
  }
}

function render(facts) {
  // Ayırıcı noktalı virgül: eksen adlarının bir kısmı zaten virgül içeriyor
  // ("Kimlik, Kürt Meselesi ve Yerel Özerklik"), virgülle birleştirince
  // 8 eksen 11 ayrı maddeymiş gibi okunuyordu.
  const axisNames = facts.axes.map((axis) => axis.name.toLowerCase()).join('; ')
  const partyLabels = facts.parties.map((party) => party.short_name || party.name).join(', ')

  return `# oyvergitsin.org

> oyvergitsin.org, Türkiye'deki seçmenlerin siyasi görüşlerini kısa ve anonim bir anketle analiz ederek hangi siyasi partiye ne kadar yakın olduklarını gösteren tarafsız bir siyasi eşleşme platformudur.

Kullanıcılar ${facts.axes.length} ideolojik eksen (${axisNames}) üzerinden ${facts.questionCount} soruya cevap verir. Sistem, kullanıcının eksen bazlı skorlarını Türkiye'deki siyasi partilerin kayıtlı pozisyonlarıyla karşılaştırarak bir benzerlik yüzdesi hesaplar. Anket tamamen anonimdir; kimlik veya iletişim bilgisi talep edilmez.

## Temel Bilgiler

- Platform: Web tabanlı, ücretsiz, üyelik gerektirmez
- Dil: Türkçe
- Kapsam: Türkiye siyaseti, ${facts.parties.length} siyasi parti
- Eksen modeli sürümü: ${facts.version}
- Yöntem: ${facts.axes.length} ideolojik eksende ${facts.questionCount} soru, sabit kurallı skorlama algoritması
- Gizlilik: Anonim oturum, kişisel veri toplanmaz

## Eksenler

${facts.axes.map((axis) => `- **${axis.name}**: ${axis.description || ''}`.trimEnd()).join('\n')}

## Karşılaştırmaya Dahil Partiler

${partyLabels}

## Sayfalar

- [Ana Sayfa](${SITE_URL}/): Platformun tanıtımı ve anketi başlatma
- [Metodoloji](${SITE_URL}/metodoloji): Eksen tanımları, puanlama algoritması, parti konumlarının nasıl kodlandığı ve kaynaklar
- [Siyaset Radarı](${SITE_URL}/siyaset-radari): Parti geçişleri, TBMM sandalye dağılımı, il bazlı seçim sonuçları ve gazeteci özgürlüğü kayıtları — hepsi kaynaklı ve doğrulama tarihli
- [Açık Rıza](${SITE_URL}/consent): Anket öncesi onam metni

## Yasal

- [Gizlilik Politikası](${SITE_URL}/legal/privacy-policy)
- [KVKK Aydınlatma Metni](${SITE_URL}/legal/kvkk-disclosure)
- [Çerez Politikası](${SITE_URL}/legal/cookie-policy)
- [Kullanım Koşulları](${SITE_URL}/legal/terms-of-use)

## Notlar

- Sonuç sayfaları ve anket akışı oturuma özgüdür, indekslenmez.
- Sonuç, oy verme tavsiyesi değildir; görüşlerin partilerin kayıtlı konumlarıyla örtüşme ölçüsüdür.
- Skorlama metodolojisi ve parti pozisyonları tarafsızlık ilkesiyle, kaynak dayalı olarak güncellenir.
- Bu dosya elle yazılmaz; \`npm run geo:llms\` ile aktif eksen modelinden üretilir.
`
}

async function main() {
  const facts = await loadFacts()
  fs.writeFileSync(OUTPUT_PATH, render(facts), 'utf8')

  console.log(
    `OK    public/llms.txt yazıldı — model ${facts.version}, ${facts.axes.length} eksen, ${facts.questionCount} soru, ${facts.parties.length} parti.`
  )
}

main().catch((error) => {
  console.error(`HATA  llms.txt üretilemedi: ${error.message}`)
  process.exit(1)
})
