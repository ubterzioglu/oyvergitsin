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
| `goc` | `identity_migration` | **Çevrildi** + merkeze çekme (aşağıya bakınız) | **Düşük** |
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

### `goc` — YAYIN ÖNCESİ ENGEL

v1'de göç, kimlikle aynı eksene sıkışmıştı. Ayrıştırma yeni kanıt gerektiriyor ve **kaynak
belgelerde yalnızca iki parti için doğrudan göç kanıtı var**:

- **AKP** (−40): beyannamede göç yönetimi merkezi koordinasyon ve düzensiz göçle mücadele
  çerçevesinde ele alınıyor.
- **YENİ PARTİ** (−20): program hak temelli dili korurken düzensiz göçe sıfır tolerans, sınır
  güvenliği ve gönüllü geri dönüş politikalarını içeriyor.

Kalan 7 parti için değer `identity_migration`dan türetildi ve **belirsizlik nedeniyle 0,5
katsayısıyla merkeze çekildi**. Gerekçe: düşük güvenilirlikli bir kestirim uç değer aldığında,
yanlış olduğunda sonucu daha çok bozar; merkeze çekmek hatanın maliyetini düşürür.

> **Bu 7 hücre kaynak belgelerden yeniden kodlanmadan v2 AKTİF EDİLMEMELİDİR.** Türetme script'i
> çalıştığında bu uyarıyı konsola da basar. Özellikle CHP ve YSP için kimlik ekseninden türetilen
> pozitif (koruma yanlısı) değerlerin gerçek göç duruşlarını yansıttığına dair kanıt yoktur.

### `sosyal`, `cevre`, `sekulerizm`, `dis` — düz çevirme

Bu dördü tek adımlı, mekanik dönüşümler. `dis`, `foreign_policy` ve `eu_relations`ın ortalaması
alınıp çevrildi; iki eksen de v1'de aynı yöne bakıyordu (+ = Batı'dan uzak), v2'de + = AB yönelimli.

`sosyal` için bir not: v2 ekseni toplumsal cinsiyet boyutunu da kapsıyor ama bu bileşen v1'de ayrı
ölçülmemişti; türetilen değer yalnızca eğitim/sosyal politika bileşenini yansıtır.

## Türetilen matris (9 parti × 8 eksen)

| Parti | ekonomi | demokrasi | sekulerizm | kimlik | goc | sosyal | cevre | dis |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| AKP | 38 | −53 | −55 | −45 | −40 | −35 | −45 | −48 |
| CHP | 15 | 35 | 35 | 40 | 15 | 40 | 30 | 40 |
| YSP | 15 | 73 | 20 | 85 | 38 | 60 | 85 | 35 |
| MHP | 28 | −65 | −45 | −75 | −35 | −30 | −25 | −58 |
| İYİ | −23 | 20 | −10 | 0 | −10 | 45 | 15 | −3 |
| Saadet | 30 | 10 | −60 | −10 | −15 | −20 | −5 | −33 |
| Gelecek | −3 | 40 | 15 | 25 | 5 | 0 | 55 | 43 |
| DEVA | −18 | 45 | 25 | 30 | 10 | 20 | 35 | 35 |
| YENİ PARTİ | 45 | 35 | 45 | 35 | −20 | 55 | 45 | 45 |

`goc` sütunundaki italik olmayan iki değer (AKP, YENİ PARTİ) doğrudan kodlama; kalanı düşük
güvenilirlikli türetmedir.

## Kapsam dışı partiler

TİP, Vatan, Zafer ve Memleket `parties` tablosunda kayıtlı ama hiçbir eksende konumları yok
(bkz. `docs/research-input-remaining-parties.md`). v2'de de konumsuz kalıyorlar.

Motor bu partileri eşleşmeye dahil etmez ve benzerlikleri `null` döner — `0` değil. Bu ayrım
önemli: `0` "tamamen zıt" demektir, `null` "yeterli kanıt yok" demektir. Sonuç ekranı bunları
sıralamanın sonunda, kanıt eksikliği notuyla gösterir. Metodoloji raporu §10 küçük partilerin
dışlanmasını sistematik bir yanlılık kaynağı sayıyor; kanıt yokluğunu görünür kılmak bu riski
tamamen ortadan kaldırmasa da gizlemez.

## Yayın öncesi yapılacaklar

- [ ] `goc` ekseninde 7 düşük güvenilirlikli hücrenin kaynak belgelerden yeniden kodlanması
- [ ] `ekonomi` ekseninde AKP ve MHP hücrelerinin bileşen ayrışması açısından gözden geçirilmesi
- [ ] `sosyal` ekseninde toplumsal cinsiyet bileşeninin ayrıca kodlanması
- [ ] TİP, Vatan, Zafer, Memleket için konum kodlaması ya da açıkça kapsam dışı ilan edilmesi
- [ ] Metodoloji raporu §6'daki iki-kodlayıcı protokolünün en az `goc` ve `demokrasi` eksenlerinde
      uygulanması ve kodlayıcılar arası güvenirlik skorunun yayımlanması
