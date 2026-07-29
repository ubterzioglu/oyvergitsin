# Parti Konumlarının v2 (8 Eksen) Modeline Türetilmesi

Tarih: 29 Temmuz 2026
Uygulama: `scripts/derive-party-positions-v2.js` — kurallar `scripts/data/party-positions-v2.js`
Metodoloji kaynağı: `resultdeepresearch.html` §3 (boyutlar) ve §6 (parti kodlama protokolü)
Veri kaynağı: `docs/party-positions-2026-update.md`, `docs/new-party-2026-research.md`,
`yeni_deep-research-report.md` (20 Temmuz 2026)

## Neden türetme, neden sıfırdan kodlama değil

Mevcut 9 parti × 10 eksen skoru atılacak veri değil: `yeni_deep-research-report.md` raporundan
hücre bazlı gerekçelerle üretilmiş ve kaynak satır numaralarıyla kayıt altına alınmıştı. 8 yeni
eksenin 6'sı bu skorlardan deterministik olarak türetilebiliyor; kalan ikisi (`goc`, `demokrasi`)
gerçek yeni yargı gerektiriyor ve aşağıda ayrıca ele alınıyor.

Metodoloji raporunun §6'daki **tam protokolü** — partilere resmî form gönderimi, iki bağımsız
insan kodlayıcı, Cohen's kappa / ICC, itiraz mekanizması — bu turda uygulanmadı. Bu bir kod işi
değil, insan araştırma sürecidir. Bu tur için hazırlanan şey o sürecin **altyapısıdır**:
`party_position_evidence` tablosu ve aşağıdaki gerekçe kaydı.

## En kritik nokta: kutup çevirmeleri

v1'in kutup konvansiyonu birkaç eksende v2'nin **tam tersidir**. Bir dönüşümde işaret çevirmesi
atlanırsa hata sessizdir: uygulama çalışmaya devam eder, sadece o eksende herkesi yanlış partiyle
eşleştirir.

| v2 ekseni | v1 kaynağı | İşlem | Güvenilirlik |
|---|---|---|---|
| `ekonomi` | `economy_market_state` + `income_distribution` | Ortalama, **işaret aynı** | Orta |
| `demokrasi` | `civil_liberties` + `security_state` | Ortalama, `security_state` **çevrildi** | Orta |
| `sekulerizm` | `secularism` | **Çevrildi** | Yüksek |
| `kimlik` | `identity_migration` | **Çevrildi** + yerel özerklik düzeltmesi | Orta |
| `goc` | — | **Türetilmedi**, kaynaklardan doğrudan kodlandı | Orta |
| `sosyal` | `education_social_policy` | **Çevrildi** | Orta |
| `cevre` | `environment_growth` | **Çevrildi** | Yüksek |
| `dis` | `foreign_policy` + `eu_relations` | Ortalama, **çevrildi** | Yüksek |

Kutup tanımlarının karşılaştırması:

| Eksen | v1'de +100 | v2'de +100 |
|---|---|---|
| secularism → sekulerizm | Dinin kamusal etkisi güçlü | Devlet dinler karşısında tarafsız |
| education_social_policy → sosyal | Seçici, aile/piyasa merkezli | Evrensel sosyal yatırım |
| environment_growth → cevre | Büyüme/kalkınma önceliği | Ekolojik koruma |
| foreign_policy / eu_relations → dis | Stratejik özerklik, AB'ye mesafeli | AB yönelimli, çok taraflı |
| identity_migration → kimlik / goc | Milliyetçi, kısıtlayıcı | Çoğulcu tanınma / koruma |
| security_state → demokrasi (bileşen) | Güçlü merkezi güvenlik aygıtı | (çevrilerek) çoğulcu denetim |

## Eksen bazlı gerekçeler

### `ekonomi` — ortalama, işaret aynı

v1'de `economy_market_state` (+ = devlet yönlendirmeli) ve `income_distribution`
(+ = güçlü yeniden dağıtım) zaten v2'nin "+100 = müdahaleci, yeniden dağıtımcı, kamu yatırımı
ağırlıklı" tanımıyla aynı yöne bakıyor. Basit ortalama alındı.

**Bilinen sınırlama:** Bu bileşik eksen, devlet yönlendirmesi güçlü ama yeniden dağıtımı sınırlı
partilerde iki bileşeni birbirine karıştırır. AKP (55 / 20) ve MHP (40 / 15) bu durumdadır;
ortalama onları "müdahaleci" ucuna taşır, ki eksen tanımı gereği doğrudur ama "yeniden dağıtımcı"
çağrışımı yanıltıcı olabilir. Bu iki hücre elden geçirilmelidir.

### `demokrasi` — iki eksenin birleşimi, biri çevrilerek

Basit ortalama değil: v1'de `civil_liberties`in +100'ü "bireysel özgürlükler", `security_state`in
+100'ü ise "güçlü merkezi güvenlik aygıtı" anlamına geliyordu — yani iki eksenin artı uçları zıt
yönlere bakıyordu. Rapordaki v2 ekseni kuvvetler ayrılığı ve yargı bağımsızlığı üzerine kurulu
olduğu için `security_state` çevrilerek ortalandı:

```
demokrasi = ortalama(civil_liberties, -security_state)
```

Sonuç, `yeni_deep-research-report.md`'nin niteliksel tablosuyla tutarlı: AKP ve MHP başkanlık
sistemi sürekliliği tarafında (-53, -65); CHP, DEVA, Gelecek, İYİ ve YENİ PARTİ güçlendirilmiş
parlamenter sistem tarafında; YSP en yüksek demokratikleşme talebiyle (+73).

### `kimlik` — çevirme + yerel özerklik düzeltmesi

v2 ekseni v1'den farklı olarak **yerel özerkliği** de kapsıyor. `yeni_deep-research-report.md`'nin
"Yerel yönetimler" satırından okunan düzeltmeler uygulandı:

| Parti | Düzeltme | Rapordaki ifade |
|---|---:|---|
| AKP | −5 | "kapasite artışı, merkezi koordinasyon baskın" |
| CHP | +10 | "katılımcı ve güçlü belediyecilik" |
| YSP | +10 | "yerelleşme ve özerklik şartı" |
| MHP | −5 | "hizmet kapasitesi artışı", çerçeve merkeziyetçi |
| İYİ | +20 | "çerçeve kanun, katılımcı mahalli idare" |
| Saadet | +20 | "görev devri ve yerel güçlenme" |
| Gelecek | +15 | "yetki devri ve demokratik yerellik" |
| DEVA | +10 | "yerel kalkınma ve veri-temelli koordinasyon" |
| YENİ PARTİ | +10 | güçlü Meclis ve yerel demokrasi vurgusu |

### `goc` — türetme terk edildi, doğrudan kodlandı

**Bu eksen artık v1 skorlarından türetilmiyor.** İlk turda `identity_migration` işaret çevrilerek
kullanılmıştı; o türetme şu örtük varsayıma dayanıyordu:

> *Kürt kimliği konusunda çoğulcu olan parti, göç konusunda da korumacıdır.*

Kaynak taraması (29 Temmuz 2026) bu varsayımın Türkiye'de **tutmadığını** gösterdi. En açık örnek
CHP: kimlik ekseninde çoğulcu kodlandığı için göçte +15 (koruma yanlısı) çıkıyordu, oysa partinin
güncel çizgisi iki yıl içinde geri gönderme taahhüdü. İYİ Parti'de fark daha da büyüktü: türetme
−10 veriyordu, gerçek konum −80.

Aşağıdaki değerler parti programları, ittifak mutabakat metinleri ve resmî açıklamalar taranarak
**doğrudan kodlanmıştır**.

| Parti | Skor | Önceki (türetme) | Dayanak |
|---|---:|---:|---|
| İYİ Parti | **−80** | −10 | Üç yıl içinde zorunlu geri dönüş hedefi, "hiçbir koşulda vatandaşlık yok", ilçe bazlı %10 kota, uyuma açık karşıtlık; Türkçe eğitimi yalnızca dönüş öncesi geçici tedbir |
| MHP | **−65** | −35 | Düzensiz göç "isimsiz işgal" ve "demografik yapıya karşı komplo" olarak tanımlanıyor; Suriye'ye gidip dönenlerin girişinin engellenmesi talebi. Resmî çizgi gönüllü dönüş olduğu için İYİ'nin gerisinde |
| CHP | **−45** | +15 | 2015'teki uyum çerçevesi (göç bakanlığı, coğrafi çekincenin kaldırılması, işgücüne katılım) terk edildi; güncel çizgi iki yılda geri gönderme ve "Suriyelilerden başlayarak tüm göçmenleri geri göndermekte kararlıyız". "Irkçılık, ayrımcılık veya düşmanlık olmadan" çerçevesi zorunlu dönüşçülerden ayırıyor |
| AKP | **−40** | −40 | "Gönüllü, güvenli ve onurlu geri dönüş"; sınır dışı reddediliyor ama güvenli bölgelere milyonluk dönüş hedefi ve kuzey Suriye'de yerleşim modeli var |
| DEVA | **−30** | +10 | Sığınma hakkı olmayanların sınır dışı edilmesi; geçici koruma altındakiler için uluslararası işbirliğiyle Suriye'nin güvenli hale getirilmesi, üçüncü ülkeye yerleştirme ve yük paylaşımı |
| Gelecek | **−30** | +5 | Millet İttifakı Ortak Politikalar Mutabakat Metni: "en kısa sürede, iç hukuk ve uluslararası hukuka uygun olarak" geri gönderme. Partiye özgü daha sert çizgi bulunamadı |
| Saadet | **−25** | −15 | Aynı ortak metne taraf; Milli Görüş geleneğindeki dayanışma vurgusu söylemi bir miktar yumuşatıyor |
| YENİ PARTİ | **−25** | −20 | Hak temelli dil + düzensiz göçe sıfır tolerans + sınır güvenliği + **gönüllü** geri dönüş. "Gönüllü" vurgusu CHP'nin güncel çizgisinden ölçülü |
| YSP (HDP–Yeşil Sol–DEM hattı) | **+75** | +38 | Zorla geri göndermeye ve "gönüllü dönüş" adı altındaki uygulamalara açık karşıtlık, geri gönderme merkezlerinin kapatılması, Cenevre Sözleşmesi coğrafi çekincesinin kaldırılması, kalanlara mülteci statüsü, eşit işe eşit ücret ve sendika hakkı, çok dilli hizmet, belediye bütçelerinin vatandaşlığa değil ikamet eden nüfusa göre dağıtılması |

**Bu eksende dikkat edilmesi gereken bulgu:** dokuz partinin sekizi −80 ile −25 arasında, yalnızca
YSP hattı pozitif tarafta. Türkiye parti siyasetinde göç konusunda gerçekten böyle bir asimetri
var; eksen iki kümeyi (dönüş odaklı çoğunluk ve koruma odaklı tek hat) net ayırıyor ama küme içi
ayrım sınırlı. Kullanıcı bu eksende ortada veya pozitif bir skor aldığında eşleşmesi büyük ölçüde
YSP'ye kayar. Bu bir hata değil, verinin kendisi — fakat sonuç yorumlanırken bilinmelidir.

**Sınır:** Bu kodlama **tek kodlayıcılıdır**. Metodoloji raporu §6 iki bağımsız kodlayıcı ve
kodlayıcılar arası güvenirlik ölçümü (Cohen's kappa / ICC) istiyor; o adım yapılmadı.

Kaynaklar: [Diken — Partilerin sığınmacı politikası](https://www.diken.com.tr/partilerin-siginmaci-politikasi-kim-ne-vadediyor/) ·
[Euronews — Partiler hangi politikaları savunuyor](https://tr.euronews.com/2022/09/13/suriyeli-siginmacilar-sorunu-turkiyedeki-siyasi-partiler-hangi-politikalari-savunuyor) ·
[DEM Parti — mülteci hakları açıklamaları](https://www.demparti.org.tr/tr/multeciler-uzerinden-yurutulen-kirli-pazarliklar-son-bulmali/17682/) ·
[Heinrich Böll — Göçmen karşıtı tutumların siyasi parti temsili](https://tr.boell.org/tr/2023/03/28/gocmen-karsiti-tutumlarin-siyasi-parti-temsili-turkiye-ornegi) ·
[Medyascope — Suriyeliler hakkında hangi siyasetçi ne demişti](https://medyascope.tv/2022/04/19/siyasetin-gundemi-multeciler-suriyeliler-hakkinda-hangi-siyasetci-ne-demisti/)

### `sosyal`, `cevre`, `sekulerizm`, `dis` — düz çevirme

Bu dördü tek adımlı, mekanik dönüşümler. `dis`, `foreign_policy` ve `eu_relations`ın ortalaması
alınıp çevrildi; iki eksen de v1'de aynı yöne bakıyordu (+ = Batı'dan uzak), v2'de + = AB yönelimli.

`sosyal` için bir not: v2 ekseni toplumsal cinsiyet boyutunu da kapsıyor ama bu bileşen v1'de ayrı
ölçülmemişti; türetilen değer yalnızca eğitim/sosyal politika bileşenini yansıtır.

## Türetilen matris (9 parti × 8 eksen)

| Parti | ekonomi | demokrasi | sekulerizm | kimlik | goc | sosyal | cevre | dis |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| AKP | 38 | −53 | −55 | −45 | −40 | −35 | −45 | −48 |
| CHP | 15 | 35 | 35 | 40 | −45 | 40 | 30 | 40 |
| YSP | 15 | 73 | 20 | 85 | 75 | 60 | 85 | 35 |
| MHP | 28 | −65 | −45 | −75 | −65 | −30 | −25 | −58 |
| İYİ | −23 | 20 | −10 | 0 | −80 | 45 | 15 | −3 |
| Saadet | 30 | 10 | −60 | −10 | −25 | −20 | −5 | −33 |
| Gelecek | −3 | 40 | 15 | 25 | −30 | 0 | 55 | 43 |
| DEVA | −18 | 45 | 25 | 30 | −30 | 20 | 35 | 35 |
| YENİ PARTİ | 45 | 35 | 45 | 35 | −25 | 55 | 45 | 45 |

`goc` sütunu doğrudan kaynak kodlamasıdır; diğer yedi sütun v1 skorlarından kurallı dönüşümle
türetilmiştir.

## Parti listesindeki düzeltmeler (29 Temmuz 2026)

Kaynak taraması sırasında parti listesinde iki hata çıktı:

- **Memleket Partisi kapanmış.** 21–22 Temmuz 2025'teki olağanüstü kongrede 277 delegenin 220'si
  kapanma yönünde oy kullandı; Muharrem İnce daha önce (24 Haziran 2025) CHP'ye dönmüştü. Var
  olmayan bir partiyi eşleştirmeye sokmak yanlış olacağı için `parties.is_active = false`
  işaretlendi. **Satır silinmedi:** eski oturumların sonuç anlık görüntüleri parti id'lerine atıf
  yapıyor, silme onları çözümsüz bırakırdı.
- **Yeşil Sol Parti artık DEM Parti.** Parti Ekim 2023'te "Halkların Eşitlik ve Demokrasi
  Partisi" adını aldı; Yargıtay HEDEP kısaltmasını kabul etmeyince Aralık 2023'te kısaltma DEM
  oldu. Aynı siyasi hat, güncel ad. Kayıt yeniden adlandırıldı.

DEVA, Gelecek ve Saadet ayrı partiler olarak duruyor: "Yeni Yol" çatısı altında ortak bir
parlamento grubu kurdular ama kurumsal kimliklerini, programlarını ve genel başkanlarını
koruyorlar. Bu yüzden ayrı ayrı kodlanmaya devam ediyorlar.

## Doğrudan kodlanan partiler (v1'de konumu olmayanlar)

TİP, Vatan Partisi ve Zafer Partisi v1 modelinde hiç konumlandırılmamıştı, dolayısıyla türetilecek
bir kaynak yok. Parti programları ve resmî belgeler taranarak doğrudan v2 eksenlerinde kodlandılar.

| Parti | ekonomi | demokrasi | sekulerizm | kimlik | goc | sosyal | cevre | dis | Eksen |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| TİP | 90 | 70 | 90 | 70 | — | 90 | 60 | −70 | 7/8 |
| Vatan | 75 | 40 | 80 | −80 | — | 20 | 25 | −85 | 7/8 |
| Zafer | 30 | 45 | 80 | — | −95 | — | — | −55 | 5/8 |

**Kanıt bulunamayan eksenler kasıtlı olarak boş bırakıldı.** TİP ve Vatan Partisi için partiye özgü
bir göç politikası; Zafer Partisi için kimlik, sosyal politika ve çevre başlıklarında konum
belgelerden çıkarılamadı (parti programının erişilebilir sürümü metin olarak okunamıyor). Uydurma
sayı yazmaktansa boş bırakmak doğru olan.

Dikkat çeken noktalar: TİP ve Vatan ekonomide en solda ama `dis` ekseninde negatif — ikisi de
NATO ve Batı ittifakı karşıtı, yani "sol ekonomi = AB yanlısı" beklentisi burada da kırılıyor.
Vatan Partisi ekonomide sol, laiklikte güçlü, kimlikte ise üniter-merkeziyetçi uçta: eksenler
arası bu gerilim gerçek ve model onu koruyor.

## Yetersiz kodlanmış partiler sıralamaya girmez

Bir parti yalnızca birkaç eksende konumlandırılmışsa, benzerliği yalnızca o eksenler üzerinden
hesaplanır — ayrıştığı konular hesaba hiç girmez ve parti haksız biçimde üste çıkabilir.

Bu yüzden bir partinin sıralanabilmesi için **karşılaştırılabilir eksenlerin en az %75'inde**
konumlandırılmış olması gerekir (`PARTY_AXIS_COVERAGE_THRESHOLD`). Sekiz eksenin tamamı
karşılaştırılabilir olduğunda eşik 6 konumdur; Zafer Partisi (5/8) bu nedenle sıralama dışı kalır
ve sonuç ekranında kaç eksende kodlandığı belirtilerek ayrıca listelenir.

Benzerlik bu durumda `null` döner, `0` değil. Ayrım önemli: `0` "tamamen zıt", `null` "yeterli
kodlama yok" demektir. Metodoloji raporu §10 küçük partilerin dışlanmasını sistematik bir yanlılık
kaynağı sayıyor; kanıt eksikliğini görünür kılmak bu riski ortadan kaldırmaz ama gizlemez.

## Yayın öncesi yapılacaklar

- [x] `goc` ekseninde 7 düşük güvenilirlikli hücrenin kaynak belgelerden yeniden kodlanması
      *(29 Temmuz 2026 — türetme terk edildi, dokuz partinin tamamı doğrudan kodlandı)*
- [x] `ekonomi` ekseninde AKP ve MHP hücrelerinin bileşen ayrışması açısından gözden geçirilmesi
      *(29 Temmuz 2026 — sorunun kaynağı AKP/MHP değil, v1'deki iki hatalı hücre çıktı; aşağıya bakınız)*
- [x] `sosyal` ekseninde toplumsal cinsiyet bileşeninin ayrıca kodlanması
      *(29 Temmuz 2026 — parti bazlı düzeltme eklendi)*
- [x] TİP, Vatan, Zafer, Memleket için konum kodlaması ya da açıkça kapsam dışı ilan edilmesi
      *(29 Temmuz 2026 — üçü kodlandı, Memleket kapandığı için listeden çıkarıldı)*
- [ ] Metodoloji raporu §6'daki iki-kodlayıcı protokolünün en az `goc` ve `demokrasi` eksenlerinde
      uygulanması ve kodlayıcılar arası güvenirlik skorunun yayımlanması

## `ekonomi` ekseni: sorun bileşen ayrışması değil, v1'de iki hatalı hücreymiş

İlk turda AKP (38) ve MHP (28) ekonomide CHP (15) ve YSP (15) ile aynı hizada ya da onların
üzerinde çıkıyordu. Bunu bileşik eksenin kaçınılmaz bir zaafı sanmıştım — yeniden dağıtım ile
devlet yönlendirmesinin aynı sayıya sıkışması. İnceleyince gerçek neden çıktı:

**v1'de iki hücrenin işareti kendi gerekçesiyle çelişiyordu.**

| Parti | v1 `economy_market_state` | v1'deki gerekçe | Sorun |
|---|---:|---|---|
| CHP | −25 | "Planlı kalkınma + vergi adaleti, kurumsal düzenleme ağırlıklı" | Skor "serbest piyasa" tarafında, gerekçe planlı kalkınma diyor |
| YSP/DEM | −50 | "Yeniden dağıtım, emek ve ekoloji merkezli ekonomi anlayışı" | Skor "asgari devlet müdahalesi" demek, gerekçe tam tersi |

v1 konvansiyonunda bu eksende −100 "serbest piyasa, asgari devlet müdahalesi", +100 "devlet
yönlendirmeli ekonomi" anlamına geliyor. İki hücre de yanlış işaretliydi. Düzeltildi:
CHP −25 → **+25**, DEM −50 → **+55**.

Sonuç: `ekonomi` ekseni artık beklenen sırayı veriyor — DEM 68, YENİ PARTİ 45, CHP 40, AKP 38,
MHP 28, Saadet 30, Gelecek −3, DEVA −18, İYİ −23. Bileşik eksen tanımına dokunmak gerekmedi.

## `sosyal` ekseni: toplumsal cinsiyet bileşeni eklendi

v2 ekseni "Refah, Eğitim, Toplumsal Cinsiyet ve Aile" başlığını taşıyor ama v1'in
`education_social_policy` ekseni toplumsal cinsiyeti hiç ölçmüyordu; düz çevirme bu bileşeni
tamamen atlıyordu. Parti bazlı düzeltme eklendi (pozitif = toplumsal cinsiyet eşitliği yönünde):

| Parti | Düzeltme | Dayanak |
|---|---:|---|
| AKP | −15 | Aile merkezli sosyal politika; İstanbul Sözleşmesi'nden çekilme kararı |
| MHP | −10 | Geleneksel aile çerçevesi, kategorik destek yaklaşımı |
| Saadet | −10 | Milli Görüş geleneğinde aile merkezli toplumsal düzen |
| İYİ | 0 | Programda belirgin bir toplumsal cinsiyet vurgusu tespit edilmedi |
| Gelecek, DEVA | +5 | Kurumsal ve kapsayıcı sosyal koruma dili |
| CHP, YENİ PARTİ | +10 | Hak temelli sosyal devlet ve toplumsal cinsiyet eşitliği vurgusu |
| DEM | +15 | Kadın özgürlüğü programın kurucu unsurlarından |
