import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicServerClient } from '@/lib/supabase/route'
import { getActiveAxisModelId } from '@/lib/scoring/active-model'
import { Card } from '@/components/ui/Card'
import { Container } from '@/components/ui/Container'
import { PartyPositionTable } from '@/components/methodology/PartyPositionTable'

export const metadata: Metadata = {
  title: 'Metodoloji — oyvergitsin.org',
  description:
    'Soru setinin, puanlama algoritmasının ve parti konumlandırmasının nasıl belirlendiği; kaynaklar ve sınırlamalar.',
}

// Her istekte veritabanından okunur.
//
// Bu sayfa AKTİF eksen modelini yayımlar. Statik önbellekle (ISR) sunulduğunda,
// aktif model değiştirildikten sonra sayfa bir sonraki yeniden doğrulamaya
// kadar eski soru setini "yayımlanmış yöntem" diye göstermeye devam ediyordu —
// yani canlı anketle çelişiyordu. Bir şeffaflık sayfası için bu kabul edilemez;
// düşük trafikli olduğu için dinamik render'ın maliyeti önemsiz.
export const dynamic = 'force-dynamic'

interface AxisRow {
  id: string
  name: string
  slug: string
  description: string
  pole_negative: string | null
  pole_positive: string | null
  order_index: number
}

interface QuestionRow {
  id: string
  code: string | null
  text: string
  type: string
  is_scored: boolean
  order_index: number
}

const EMPTY_METHODOLOGY = {
  model: null,
  axes: [] as AxisRow[],
  questions: [] as QuestionRow[],
  scoredQuestionIds: new Set<string>(),
}

/**
 * Sayfa build sırasında prerender edildiği için veritabanına erişilemediğinde
 * tüm build'i düşürmemeli. Hata halinde boş içerikle render edilir; bir
 * sonraki yeniden doğrulamada dolar.
 */
async function loadMethodology() {
  try {
    return await fetchMethodology()
  } catch (error) {
    console.error('Metodoloji sayfası verisi alınamadı:', error)
    return EMPTY_METHODOLOGY
  }
}

async function fetchMethodology() {
  const supabase = getPublicServerClient()
  const axisModelId = await getActiveAxisModelId(supabase)

  if (!axisModelId) {
    return EMPTY_METHODOLOGY
  }

  const [modelResult, axesResult, questionsResult] = await Promise.all([
    supabase.from('axis_models').select('name, version, created_at').eq('id', axisModelId).single(),
    supabase
      .from('axes')
      .select('id, name, slug, description, pole_negative, pole_positive, order_index')
      .eq('axis_model_id', axisModelId)
      .order('order_index', { ascending: true }),
    supabase
      .from('questions')
      .select('id, code, text, type, is_scored, order_index')
      .eq('axis_model_id', axisModelId)
      .order('order_index', { ascending: true }),
  ])

  const questions = (questionsResult.data ?? []) as QuestionRow[]

  // "Puanlanan madde" sayısı questions.is_scored'dan okunamaz: o alan varsayılan
  // olarak true ve puanlama kuralı olmayan maddelerde de true kalır. Gerçekten
  // skora giren madde, en az bir scoring_rules satırı olan maddedir.
  const { data: rules } = questions.length
    ? await supabase
        .from('scoring_rules')
        .select('question_id')
        .in(
          'question_id',
          questions.map((question) => question.id)
        )
    : { data: [] }

  return {
    model: modelResult.data,
    axes: (axesResult.data ?? []) as AxisRow[],
    questions,
    scoredQuestionIds: new Set((rules ?? []).map((rule) => rule.question_id)),
  }
}

export default async function MethodologyPage() {
  const { model, axes, questions, scoredQuestionIds } = await loadMethodology()
  const scoredQuestions = questions.filter((question) => scoredQuestionIds.has(question.id))

  // Kutup tanımı, bir eksen modelinin belgelenmiş olmasının işaretidir. Tanımı
  // olmayan bir model geliştirme içeriğidir ve "yayımlanmış yöntem" gibi
  // sunulmamalıdır — şeffaflık sayfasının yanlış bilgi vermesi amacını bozar.
  const isDocumented = axes.length > 0 && axes.every((axis) => axis.pole_negative && axis.pole_positive)

  return (
    <div className="min-h-screen bg-surface px-4 py-12">
      <Container size="md">
        <h1 className="mb-3 font-heading text-4xl font-semibold text-ink-primary">Metodoloji</h1>
        <p className="mb-6 text-ink-secondary">
          Bu araç, politika görüşlerinizin partilerin kayıtlı konumlarıyla ne kadar örtüştüğünü ölçer.
          Bir oy verme tavsiyesi değildir. Aşağıda soru setinin, puanlama algoritmasının ve parti
          konumlandırmasının nasıl belirlendiği, kaynaklarıyla birlikte açıklanmıştır.
        </p>

        {!isDocumented && (
          <Card className="mb-8 border-l-4 border-l-rainbow-orange">
            <h2 className="mb-2 font-heading text-lg font-semibold text-ink-primary">
              Yayına hazırlanan yöntem henüz devrede değil
            </h2>
            <p className="text-sm text-ink-secondary">
              Şu anda ankette kullanılan soru seti bir <strong>geliştirme setidir</strong>: soru
              tiplerini denemek için yazılmıştır, ampirik olarak doğrulanmış bir ölçüm aracı
              değildir ve eksen uçları tanımlanmamıştır. Bu sayfa aşağıda o setin gerçek içeriğini
              gösterir; sonuçları siyasi görüşünüzün geçerli bir ölçümü olarak okumayın.
            </p>
          </Card>
        )}

        <Card elevated className="mb-8">
          <h2 className="mb-4 font-heading text-2xl font-semibold text-ink-primary">Sürüm</h2>
          {model ? (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <Term label="Eksen modeli" value={`${model.name} (${model.version})`} />
              <Term label="Eksen sayısı" value={String(axes.length)} />
              <Term label="Puanlanan madde" value={String(scoredQuestions.length)} />
              <Term
                label="Yayın tarihi"
                value={new Date(model.created_at).toLocaleDateString('tr-TR')}
              />
            </dl>
          ) : (
            <p className="text-sm text-ink-secondary">Aktif eksen modeli bulunamadı.</p>
          )}
        </Card>

        <Card elevated className="mb-8">
          <h2 className="mb-2 font-heading text-2xl font-semibold text-ink-primary">Eksenler</h2>
          <p className="mb-6 text-sm text-ink-secondary">
            Her eksen −100 ile +100 arasında bir skala. Uç tanımları betimleyicidir; bir uç
            diğerinden daha doğru ya da daha iyi değildir.
          </p>
          <div className="space-y-5">
            {axes.map((axis) => (
              <section key={axis.id} className="border-l-4 border-l-rainbow-blue pl-4">
                <h3 className="font-semibold text-ink-primary">{axis.name}</h3>
                <p className="mt-1 text-sm text-ink-secondary">{axis.description}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Pole label="−100" text={axis.pole_negative} />
                  <Pole label="+100" text={axis.pole_positive} />
                </div>
              </section>
            ))}
          </div>
        </Card>

        <Card elevated className="mb-8">
          <h2 className="mb-2 font-heading text-2xl font-semibold text-ink-primary">Soru seti</h2>
          <p className="mb-6 text-sm text-ink-secondary">
            {isDocumented ? (
              <>
                Tüm maddeler politika önermesi biçimindedir. Her eksende hem olumlu hem olumsuz
                anahtarlı maddeler bulunur; böylece &ldquo;hep katılıyorum&rdquo; işaretleme
                alışkanlığı skoru tek yöne itmez.
              </>
            ) : (
              <>
                Ankette şu an sorulan maddeler. Yanında &ldquo;puanlanmaz&rdquo; yazanlar hiçbir
                eksene katkı vermez.
              </>
            )}
          </p>
          <ol className="space-y-2">
            {questions.map((question) => (
              <li key={question.id} className="flex gap-3 text-sm">
                <span className="w-6 shrink-0 text-right text-ink-muted">{question.order_index}</span>
                <span className="text-ink-secondary">
                  {question.text}
                  {!scoredQuestionIds.has(question.id) && (
                    <span className="ml-2 rounded bg-surface-muted px-1.5 py-0.5 text-[11px] text-ink-muted">
                      puanlanmaz
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </Card>

        <Card elevated className="mb-8">
          <h2 className="mb-4 font-heading text-2xl font-semibold text-ink-primary">Puanlama</h2>

          <h3 className="mb-2 font-semibold text-ink-primary">Eksen skoru</h3>
          <p className="mb-3 text-sm text-ink-secondary">
            Bir eksenin skoru, o eksende <strong>yanıtladığınız</strong> maddelerin ulaşılabilir
            maksimum puanına göre normalize edilir. Ham toplamı kesip atmak yerine oranlamak, farklı
            sayıda maddeye sahip eksenlerin karşılaştırılabilir kalmasını sağlar.
          </p>
          <Formula>
            {`skor = 100 × Σ(ağırlık × cevap puanı) / Σ(ağırlık × maddenin maksimumu)`}
          </Formula>
          <ul className="mb-6 mt-3 list-disc space-y-1 pl-5 text-sm text-ink-secondary">
            <li>
              <strong>Kararsızım</strong> gerçek bir sıfır puandır ve paydaya girer.
            </li>
            <li>
              <strong>Fikrim yok</strong> hem paydan hem paydadan çıkarılır; o madde hiç sorulmamış
              gibi işlenir.
            </li>
            <li>
              Bir eksende maddelerin yarısından azını yanıtlarsanız o eksen parti eşleşmesine dahil
              edilmez ve sonucunuzda ayrıca belirtilir.
            </li>
          </ul>

          <h3 className="mb-2 font-semibold text-ink-primary">Parti benzerliği</h3>
          <p className="mb-3 text-sm text-ink-secondary">
            Ağırlıklı Manhattan (şehir bloku) uzaklığı kullanılır. Yalnızca sizin skor ürettiğiniz ve
            partinin konumlandığı eksenler hesaba girer.
          </p>
          <Formula>
            {`uzaklık = Σ(önem × |sizin skorunuz − parti skoru|)
benzerlik = 100 × (1 − uzaklık / (200 × Σönem))`}
          </Formula>
          <p className="mt-3 text-sm text-ink-secondary">
            Bir konuyu &ldquo;benim için önemli&rdquo; işaretlerseniz o eksenin ağırlığı 1 yerine 1,5 olur. İki
            kat ağırlık, tek bir konunun sonucu gereğinden fazla belirlemesine yol açtığı için
            tercih edilmedi.
          </p>
        </Card>

        <PartyPositionTable axes={axes} className="mb-8" />

        <Card elevated className="mb-8">
          <h2 className="mb-4 font-heading text-2xl font-semibold text-ink-primary">
            Bilinen sınırlamalar
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-ink-secondary">
            <li>
              Yüzde bir olasılık değildir. İlk sıralardaki sonuçlar birbirine yakınsa, soru
              setindeki küçük değişiklikler sıralamayı değiştirebilir; sonuç ekranı bu durumda uyarı
              gösterir.
            </li>
            <li>
              Sekiz eksen Türkiye siyasetinin tamamını kapsamaz. Seçim dönemine özgü konular ayrı
              modüller olarak eklenebilir.
            </li>
            <li>
              Parti konumları, yayımlanmış resmî belgelere dayanır; partilerin fiili uygulamalarını
              değil, beyan ettikleri konumları yansıtır.
            </li>
            <li>
              Konum kodlaması bulunmayan partiler sıfır puan almaz; karşılaştırma dışı bırakılır ve
              sonuç ekranında ayrıca listelenir.
            </li>
            <li>
              Konum kodlaması <strong>tek bir kodlayıcı</strong> tarafından yapılmıştır. İki bağımsız
              kodlayıcı ve aralarındaki uyumun ölçülmesi daha güçlü bir yöntemdir; bu adım henüz
              uygulanmadı.
            </li>
            <li>
              Soru seti henüz bilişsel görüşme ve psikometrik pilot aşamalarından geçmemiştir;
              maddelerin ayırt ediciliği ve iç tutarlılığı yayın öncesi test edilecektir.
            </li>
            <li>
              Bazı eksenlerde konumlar, önceki eksen modelindeki kodlamalardan kurallı dönüşümle
              türetildi. Yukarıdaki tabloda türetilmiş hücreler işaretlidir.
            </li>
          </ul>
        </Card>

        <Card elevated className="mb-8">
          <h2 className="mb-2 font-heading text-2xl font-semibold text-ink-primary">
            Kaynaklar ve düzeltme talebi
          </h2>
          <p className="mb-4 text-sm text-ink-secondary">
            Parti konumları aşağıdaki kaynak türlerinden, bu sırayla kodlanır: güncel seçim
            beyannamesi, resmî parti programı, resmî parti açıklaması, yasama davranışı, akademik
            uzman veri setleri. Her parti-eksen konumu için kullanılan kaynak ve kodlama gerekçesi
            kayıt altındadır.
          </p>
          <p className="text-sm text-ink-secondary">
            Bir partinin konumunun yanlış kodlandığını düşünüyorsanız — özellikle bir parti
            temsilcisiyseniz — sayfanın altındaki geri bildirim düğmesinden iletin. Yeni kaynak
            gösteren bildirimler değerlendirilir; değişiklik yapıldığında eski ve yeni değer
            gerekçesiyle birlikte kayda geçer.
          </p>
        </Card>

        <div className="text-sm">
          <Link
            href="/"
            className="text-rainbow-blue underline underline-offset-4 hover:text-rainbow-blue-hover"
          >
            Ana sayfaya dön
          </Link>
        </div>
      </Container>
    </div>
  )
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink-primary">{value}</dd>
    </div>
  )
}

function Pole({ label, text }: { label: string; text: string | null }) {
  return (
    <div className="rounded-lg bg-surface-muted px-3 py-2">
      <span className="block text-xs font-semibold text-ink-muted">{label}</span>
      <span className="text-sm text-ink-secondary">{text ?? '—'}</span>
    </div>
  )
}

function Formula({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-ink-primary px-4 py-3 text-xs leading-relaxed text-white">
      {children}
    </pre>
  )
}
