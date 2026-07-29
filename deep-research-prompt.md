# Deep Research Prompt — Türkiye için Oy Verme Danışma Aracı (VAA) Metodolojisi

## Rol ve Amaç

Sen karşılaştırmalı siyaset bilimi, anket metodolojisi (survey methodology) ve oy verme danışma araçları (Voting Advice Applications / VAA) konusunda uzman bir araştırmacısın. Türkiye seçmenine yönelik, kullanıcının siyasi görüşlerini ölçüp Türkiye'deki siyasi partilerle eşleştiren bir web uygulamasının **soru seti ve puanlama metodolojisini** sıfırdan tasarlayabilmem için akademik referanslara dayalı, uygulanabilir bir metodoloji dokümanı hazırlamanı istiyorum.

Bu bir akademik literatür özeti değil, **uygulama dokümanı** olacak: sonunda elimde kodlanabilir bir soru seti, boyut tanımları ve puanlama şeması olmalı.

## Bağlam: Mevcut Sistem

Uygulama çalışır durumda ama içerik tarafı boş. Şu anki 25 soru gerçek bir anket değil — geliştirme sırasında her soru tipini test etmek için yazılmış demo verisi (her soru farklı bir soru tipinin örneği). Puanlama da fiilen çalışmıyor: 25 sorunun sadece 2'si skoru etkiliyor, kalan 23'ü sonuca hiç dokunmuyor.

### Mevcut veri modeli (araştırma çıktısı buna oturmalı)

```
axes                (10 boyut)
  id, name                                  örn. "Ekonomi: Piyasa vs Devlet"

questions
  id, text, description, type, required, order_index

question_options
  id, question_id, text, value, order_index

scoring_rules
  id, question_id, answer_value, axis_id, score_modifier
  --> kullanıcı X sorusuna Y cevabını verdiyse, Z ekseninin skoruna
      score_modifier eklenir

party_positions
  id, party_id, axis_id, score                -100 ile +100 arası

Kullanıcı eksen skoru: kuralların toplamı, [-100, +100] aralığına kırpılır
Parti benzerliği: 100 - ortalama(|kullanıcı_skoru - parti_skoru|)
                  (partinin pozisyonu olan eksenler üzerinden)
```

Desteklenen soru tipleri: tekli seçim, çoklu seçim, açılır liste, sıralama (ranking), zorunlu ikili seçim (forced choice), matris, 5 ve 7 noktalı Likert, 0-100 kaydırıcı, sayısal giriş, 100 puan dağıtımı (allocation), senaryo tabanlı soru, vinyet + Likert, açık metin, görsel seçim, dikkat kontrolü (attention check).

Mevcut 10 eksen: Ekonomi (Piyasa vs Devlet), Gelir Dağılımı, Sivil Özgürlükler, Güvenlik ve Devlet, Sekülerizm, Kimlik ve Göç, Dış Politika, AB İlişkileri, Eğitim ve Sosyal Politika, Çevre ve Kalkınma. Bu eksenler sorgulanabilir — araştırma sonucunda değiştirilmesi gerekiyorsa gerekçesiyle öner.

## Araştırma Soruları

### 1. Yerleşik VAA'ların metodolojisi
Almanya'daki **Wahl-O-Mat**, Hollanda'daki **StemWijzer** ve **Kieskompas**, İsviçre'deki **smartvote**, Kanada/Avustralya'daki **Vote Compass**, ABD'deki **iSideWith**, İrlanda'daki **euandi/EU Profiler** araçlarını karşılaştır:

- Kaç soru soruyorlar, hangi formatta (ikili/üçlü/Likert), neden o formatı seçmişler?
- Tek boyutlu (Wahl-O-Mat tipi ham örtüşme sayımı) mi, çok boyutlu uzamsal model (Kieskompas/Vote Compass tipi) mi kullanıyorlar? Her yaklaşımın avantaj/dezavantajı nedir?
- Eşleştirme algoritmaları tam olarak nasıl işliyor? (şehir bloku uzaklığı / Öklid uzaklığı / basit örtüşme sayımı / ağırlıklı skorlama) Formülleriyle ver.
- Kullanıcıya "önem ağırlığı" (bu konu benim için önemli) veriyorlar mı? Veriyorlarsa nasıl işliyor ve bunun sonuçlar üzerindeki etkisi ne?
- "Kararsızım / fikrim yok" seçeneği sunuluyor mu, nasıl puanlanıyor?

### 2. Türkiye siyasetinin boyutları
Türkiye siyasi rekabetinin ampirik olarak doğrulanmış boyutları hangileri?

- **Chapel Hill Expert Survey (CHES)** Türkiye verisi, **Manifesto Project (MARPOR/CMP)**, **V-Dem**, **Varieties of Party Identity and Organization (V-Party)**, Türkiye üzerine çalışan siyaset bilimcilerin (Ergun Özbudun, Ali Çarkoğlu, Ersin Kalaycıoğlu, Sabri Sayarı, Berk Esen, Şebnem Gümüşçü gibi) boyut analizlerini kullan.
- Türkiye'de klasik sol-sağ ekonomik eksen ne kadar açıklayıcı? Literatürde sıkça öne çıkan **merkez-çevre**, **laik-dindar**, **Türk-Kürt kimlik**, **otoriter-demokratik** eksenlerinin göreli ağırlığı nedir?
- Faktör analizi / boyut indirgeme çalışmaları kaç boyut buluyor? 10 eksen fazla mı, az mı? Hangi eksenler ampirik olarak birbirinden ayrışmıyor (yüksek korelasyonlu, birleştirilmeli)?
- 2023 ve sonrası dönemde hangi yeni bölünme hatları (cleavage) belirginleşti? (göç/sığınmacı politikası, ekonomik kriz yönetimi, yargı bağımsızlığı, yerel yönetim özerkliği vb.)

### 3. Soru (item) yazımı standartları
- VAA sorularının kutuplaştırıcı, yönlendirici (leading) veya çift-namlulu (double-barreled) olmaması için hangi kurallar geçerli? Somut iyi/kötü örneklerle.
- Sorular **politika önermesi** (policy statement, "X yapılmalıdır") mi olmalı yoksa **değer ifadesi** mi? Hangisi partileri daha iyi ayrıştırır?
- Bir soru setinin partileri gerçekten ayrıştırdığını nasıl test ederiz? (discrimination / ayırt edicilik ölçütleri, madde-toplam korelasyonu, Cronbach alfa, IRT madde bilgi fonksiyonu)
- Sosyal beğenilirlik yanlılığı (social desirability bias) Türkiye bağlamında hangi konularda güçlü ve nasıl azaltılır? (dolaylı sorma, liste deneyi, vinyet kullanımı)
- Dikkat kontrolü (attention check) ve tutarlılık kontrolü soruları nasıl tasarlanır, kaç tane olmalı?
- Optimal anket uzunluğu nedir? Tamamlanma oranı (completion rate) ile soru sayısı ilişkisi üzerine ampirik bulgular neler?

### 4. Parti pozisyonlarının kodlanması
Bu en hassas kısım — partilerin her eksendeki pozisyonu nasıl belirlenmeli?

- Dört yöntemi karşılaştır: **(a) parti beyanı** (partilere sorulup cevaplarının alınması, smartvote modeli), **(b) uzman anketi** (CHES modeli), **(c) parti programı içerik analizi** (Manifesto Project modeli), **(d) parlamento oy kayıtları / yasama davranışı**.
- Her birinin güvenilirliği, yanlılığı, maliyeti ve **hukuki savunulabilirliği** nedir?
- Bir parti "bizi yanlış konumlandırdınız" derse hangi yöntem savunulabilir bir gerekçe sunar?
- Kodlama şeffaflığı için ne yayınlanmalı? (kodlama kılavuzu, kaynak alıntıları, kodlayıcılar arası güvenirlik / inter-coder reliability skorları)
- İki veya daha fazla kodlayıcı kullanılması gerekiyor mu, anlaşmazlık nasıl çözülür?

### 5. Tarafsızlık, hukuk ve etik (Türkiye özelinde)
- Türkiye'de seçim dönemlerinde siyasi içerikli çevrimiçi araçlar hangi mevzuata tabi? (298 sayılı Seçim Kanunu, YSK düzenlemeleri, seçim anketi yayımlama yasakları) Bir VAA "anket" sayılır mı?
- **KVKK** açısından: siyasi görüş özel nitelikli kişisel veri. Açık rıza, veri minimizasyonu, anonimleştirme ve saklama süresi için pratik gereklilikler neler? Sonuçları kullanıcı hesabına bağlamadan tutmak mümkün mü?
- Uluslararası VAA'ların tarafsızlık beyanı, metodoloji sayfası ve şeffaflık uygulamalarından örnekler.
- Hangi partilerin dahil edileceğine dair eşik nasıl belirlenmeli? (meclis grubu, oy oranı eşiği, seçime katılma yeterliliği) Küçük partileri dışlamanın yarattığı yanlılık nasıl ele alınıyor?

### 6. Sonuç sunumu
- Sonuçlar nasıl gösterilmeli: yüzde eşleşme sıralaması mı, iki boyutlu siyasi harita mı, eksen bazlı çubuk grafik mi? Her birinin kullanıcı tarafından yanlış yorumlanma riski nedir?
- Yüzde uyum skorlarının yarattığı sahte kesinlik (false precision) algısı nasıl yönetiliyor? Güven aralığı veya "yakın sonuçlar" uyarısı gösteren örnekler var mı?
- Kullanıcıya "neden bu parti çıktı" açıklaması nasıl üretilmeli? (en belirleyici sorular, en çok ayrışılan konular)

## İstenen Çıktı Formatı

Aşağıdaki bölümleri, **her iddia için kaynak göstererek** (yazar, yıl, yayın/kurum, mümkünse bağlantı) üret:

1. **Yönetici özeti** — 10 maddede temel metodolojik kararlar ve gerekçeleri.
2. **Karşılaştırma tablosu** — İncelenen VAA'lar × (soru sayısı, format, boyut modeli, eşleştirme formülü, ağırlıklandırma, parti pozisyonu kaynağı).
3. **Boyut önerisi** — Türkiye için önerilen eksen listesi. Her eksen için: ad, kısa tanım, −100 ve +100 uçlarının ne anlama geldiği, bu ekseni destekleyen ampirik kaynak, mevcut 10 eksenle ilişkisi (koru / birleştir / çıkar / ekle ve neden).
4. **Örnek soru seti** — Önerilen her eksen için en az 3 örnek soru. Her soru için: tam Türkçe metin, önerilen soru tipi, şıklar ve her şıkkın hangi eksene kaç puan katkı yapacağı (yukarıdaki `scoring_rules` yapısına birebir uyacak şekilde: `answer_value`, `axis_id`, `score_modifier`). Kaynak veya gerekçe ile.
5. **Puanlama ve eşleştirme şeması** — Önerilen algoritmanın matematiksel tanımı. Çoklu seçim, sıralama, matris, kaydırıcı ve puan dağıtımı gibi tipler için skorun nasıl hesaplanacağı (mevcut sistem sadece birebir string eşleşmesi yapıyor, bu tipler için çalışmıyor — her tip için somut formül gerekli). Cevapsız/kararsız durumların ele alınışı. Önem ağırlığı kullanılacaksa formüle nasıl gireceği.
6. **Parti pozisyonu kodlama protokolü** — Adım adım uygulanabilir prosedür, kullanılacak kaynaklar, kodlayıcı sayısı, anlaşmazlık çözümü, güvenirlik ölçütü ve yayımlanacak şeffaflık belgeleri.
7. **Doğrulama planı** — Yayına almadan önce soru setinin geçerliliğini test etme adımları: pilot örneklem büyüklüğü, bakılacak istatistikler (ayırt edicilik, iç tutarlılık, boyutsallık), başarı eşikleri ve başarısızlık halinde ne yapılacağı.
8. **Hukuki ve etik kontrol listesi** — Türkiye mevzuatına göre yayın öncesi tamamlanması gerekenler.
9. **Riskler ve açık sorular** — Literatürde uzlaşı olmayan noktalar, bu bağlamda en büyük metodolojik riskler ve azaltma önerileri.

## Kalite Kuralları

- **Kaynak zorunlu.** Kaynaksız iddiada bulunma. Bir konuda güvenilir kaynak bulamazsan bunu açıkça "kaynak bulunamadı, uzman görüşü gerekli" diye işaretle — uydurma.
- Türkiye'ye özgü bulguları, başka ülkelerden genelleme yapılan bulgulardan **ayrı ayrı işaretle**.
- Akademik kaynakları (hakemli makale, kitap) resmî kurum yayınlarından, onları da gazete/blog içeriğinden ayır ve hangisinin ne olduğunu belirt.
- Örnek sorular **Türkçe** ve doğrudan kullanılabilir olsun; İngilizce'den çeviri kokan ifadelerden kaçın.
- Belirli bir partiyi kayıran veya bir siyasi pozisyonu normatif olarak üstün gösteren dil kullanma. Eksen uçları tarafsız betimleyici olmalı.
- Mevcut sistemin bir tasarım kararı hatalıysa bunu açıkça söyle; mevcut yapıyı korumak zorunda değilsin.
- Güncel olmayan verilere dayanma; 2023 sonrası Türkiye siyasetindeki değişimleri dikkate al ve kaynakların tarihini belirt.
