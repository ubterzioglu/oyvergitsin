# Parti-Eksen Skor Güncellemesi (2026) — `yeni_deep-research-report.md` kaynaklı

Bu doküman, `yeni_deep-research-report.md` raporundaki niteliksel bulguların, uygulamanın
mevcut 10 `axes` şemasına nasıl sayısal skorlara (-100..+100) çevrildiğini gerekçeleriyle
kayıt altına alır. Kaynak: `scripts/update-party-positions.js` bu dosyadaki skorları DB'ye
yazar.

**Kapsam:** AKP, CHP, YSP (HDP–Yeşil Sol hattı), MHP, İYİ Parti, Saadet, Gelecek, DEVA
(rapordaki 8 parti, DB'de 8 satır). 25 Temmuz 2026'da BBC Türkçe/Yargıtay/resmi program
araştırmasıyla **YENİ PARTİ** de eklendi — bkz. `docs/new-party-2026-research.md`.
TİP, Vatan, Zafer, Memleket bu turda **dokunulmadı** — bkz.
`docs/research-input-remaining-parties.md`.

**HDP/YSP notu (DB gerçeği ile düzeltildi):** DB'de ayrı bir "HDP" `short_name`'i **yok**
— sadece `YSP` ("Yeşil Sol Parti") var (bkz. `lib/parties.ts`, `scripts/seed.js`). HDP,
2023 seçiminde oylarını Yeşil Sol Parti listesine yönlendirdiği için rapor da "HDP–Yeşil
Sol hattı"nı tek bir analiz olarak ele alıyor. Bu nedenle rapordaki HDP bölümünden
türetilen skorlar doğrudan **`YSP`** satırına yazıldı (script ilk çalıştırmada "HDP"
short_name'i aranmış ve bulunamamıştı; ikinci çalıştırmada `YSP` olarak düzeltildi).

## Eksen kutup tanımları (bu turda belirlenen konvansiyon)

`docs/research-input.md`'de bu alanlar boş bırakılmıştı (`TAMAMLA`); aşağıdaki konvansiyon
rapordaki karşılaştırmalı analizle tutarlı olacak şekilde bu turda tanımlandı:

| Eksen (slug) | -100 anlamı | +100 anlamı |
|---|---|---|
| economy_market_state | Serbest piyasa, asgari devlet müdahalesi | Devlet yönlendirmeli/güdümlü ekonomi |
| income_distribution | Düşük yeniden dağıtım, düşük vergi-transfer | Güçlü yeniden dağıtım, yüksek sosyal transfer |
| civil_liberties | Devlet otoritesi/toplumsal düzen önceliği | Bireysel özgürlükler ve çoğulculuk önceliği |
| security_state | Minimal güvenlik aygıtı, sivil denetim | Güçlü/merkezi güvenlik-devlet aygıtı |
| secularism | Katı laiklik | Dinin kamusal/siyasal alanda etkisi güçlü |
| identity_migration | Çoğulcu, açık kimlik/göç politikası | Milliyetçi, kısıtlayıcı kimlik/göç politikası |
| foreign_policy | Çok taraflı, ittifak temelli dış politika | Stratejik özerklik, tek taraflı/millî çizgi |
| eu_relations | AB tam üyelik/entegrasyon hedefi net | AB'ye mesafeli veya koşullu yaklaşım |
| education_social_policy | Evrensel, kamusal sağlanan sosyal politika | Seçici, aile/piyasa merkezli sosyal politika |
| environment_growth | Çevre/iklim önceliği | Büyüme/kalkınma önceliği |

## Skor matrisi (8 parti × 10 eksen)

Her hücre: `score` (-100..+100) ve rapordan 1 cümlelik gerekçe. Kaynak satır numaraları
`yeni_deep-research-report.md`'ye referanstır.

### AKP
| Eksen | Skor | Gerekçe |
|---|---|---|
| economy_market_state | 55 | Kamu yönlendirmeli yatırım-sanayi-teknoloji zinciri, devlet öncülüğü belirgin (satır 74) |
| income_distribution | 20 | Seçici sosyal destek genişlemesi, kapsamlı yeniden dağıtımdan çok hedefli transfer (satır 46, 74) |
| civil_liberties | -45 | Sistem içi yeniden yazım perspektifi, rejim sürekliliği vurgusu (satır 34, 74) |
| security_state | 60 | Savunma sanayii, terörle mücadele, merkezi göç yönetimi önceliği (satır 74) |
| secularism | 55 | Muhafazakâr-demokrat kimlik, aile merkezli sosyal politika (satır 72, 74) |
| identity_migration | 40 | Göç yönetiminin merkezi koordinasyonla sürdürülmesi vurgusu (satır 74) |
| foreign_policy | 60 | Stratejik özerklik, savunma ve göç yönetimi merkezli dış politika (satır 47) |
| eu_relations | 35 | Raporda AB üyeliği öncelikli hedef olarak geçmiyor, savunma/özerklik öne çıkıyor (satır 47) |
| education_social_policy | 35 | Aile merkezli, seçici destek genişlemesi (satır 46) |
| environment_growth | 45 | Çevre şehircilik/bölgesel kalkınma ile birlikte, ayrı öncelik değil (satır 38, 49, 74) |

### CHP
| Eksen | Skor | Gerekçe |
|---|---|---|
| economy_market_state | -25 | Planlı kalkınma + vergi adaleti, piyasa karşıtı değil ama kurumsal düzenleme ağırlıklı (satır 45, 84) |
| income_distribution | 55 | Dolaylı vergiden doğrudan vergiye kayış, güçlü sosyal devlet vurgusu (satır 86) |
| civil_liberties | 55 | Yargı bağımsızlığı, AİHS/AİHM standartları, güçlendirilmiş parlamenter sistem (satır 44, 48, 84) |
| security_state | -15 | Güvenlik vatandaş güvenliği ve demokratik denetimle birlikte ele alınıyor (satır 84) |
| secularism | -35 | Sosyal demokrasi, yurttaşlık temelli kimlik vurgusu (satır 82) |
| identity_migration | -30 | Hak temelli, katılımcı ve çoğulcu çerçeve (satır 46, 82) |
| foreign_policy | -25 | Kurumsal dış politika, ittifak temelli (satır 47) |
| eu_relations | -55 | AB tam üyelik hedefi açıkça korunuyor (satır 47, 84) |
| education_social_policy | -40 | Kamusal eğitim ve sağlık, hak temelli sosyal devlet (satır 46, 84) |
| environment_growth | -30 | İklim dayanıklılığı ve adil dönüşüm, yeşil-mor-dijital ekonomi (satır 49, 84) |

### YSP (DB satırı — rapordaki "HDP–Yeşil Sol hattı" analizi buraya uygulandı)
| Eksen | Skor | Gerekçe |
|---|---|---|
| economy_market_state | -50 | Yeniden dağıtım, emek ve ekoloji merkezli ekonomi anlayışı (satır 45-46, 94) |
| income_distribution | 80 | En düşük emekli aylığını asgari ücrete yükseltme gibi güçlü yeniden dağıtım vaatleri (satır 94) |
| civil_liberties | 85 | Yürütmenin yargı tahakkümünü kaldırma, çoğulcu-demokratikleşme talepleri (satır 34, 94) |
| security_state | -60 | Güvenlik doktrini değişimi talebi, merkezi güvenlik aygıtına eleştiri (satır 96) |
| secularism | -20 | Raporda doğrudan işlenmiyor; çoğulculuk/laiklik ile dolaylı uyumlu, düşük güvenilirlik | 
| identity_migration | -75 | Halkların eşitliği, kadın özgürlüğü, yerelleşme ekseninde çoğulcu kimlik siyaseti (satır 34, 92, 94) |
| foreign_policy | -40 | Barış, demokratikleşme, halkların eşitliği merkezli (satır 47) |
| eu_relations | -30 | Raporda doğrudan işlenmiyor; demokratikleşme talebiyle dolaylı AB-uyumlu okunabilir, düşük güvenilirlik |
| education_social_policy | -60 | Toplumsal eşitlik, kadın ve çocuk hakları merkezli sosyal politika (satır 46) |
| environment_growth | -85 | İklim adaletini sistemin merkezine koyma, fosilden çıkış, Kanal İstanbul'u iptal (satır 38, 94) |

### MHP
| Eksen | Skor | Gerekçe |
|---|---|---|
| economy_market_state | 40 | Millî üretim ve güvenlik perspektifiyle sınırlandırılmış piyasa ekonomisi (satır 104) |
| income_distribution | 15 | Emekli-engelli-şehit yakınlarına yönelik hedefli koruma, genel yeniden dağıtımdan çok kategorik (satır 46, 104) |
| civil_liberties | -55 | Başkanlık sistemini tahkim, rejim sürekliliği (satır 34, 44, 106) |
| security_state | 75 | Güvenlik merkezli, milli birlik ve sistem istikrarı vurgusu (satır 47, 102) |
| secularism | 45 | Milliyetçi-muhafazakâr çizgi, "Millî Yükseliş İradesi" (satır 102) |
| identity_migration | 70 | Milliyetçi-devletçi kimlik çerçevesi, güvenlik merkezli göç yaklaşımı (satır 102, 104) |
| foreign_policy | 55 | Güvenlik merkezli, AB'ye koşullu yaklaşım (satır 47) |
| eu_relations | 60 | AB üyeliği kimlik-kader mecburiyeti sayılmıyor, milli şartlara bağlı (satır 104) |
| education_social_policy | 30 | Aile-emekli-engelli odaklı, evrensellikten çok kategorik destek (satır 46) |
| environment_growth | 25 | Sürdürülebilir kalkınma, "çevrecilik milliyetçiliktir" çerçevesi (satır 38, 49) |

### İYİ Parti
| Eksen | Skor | Gerekçe |
|---|---|---|
| economy_market_state | -35 | TCMB araç bağımsızlığı, düşük enflasyon, piyasa güveni odaklı (satır 45, 114) |
| income_distribution | -10 | Raporda gelir dağılımına dair açık bir vaat sınırlı; makro istikrar öncelikli, düşük güvenilirlik |
| civil_liberties | 50 | Güçlendirilmiş parlamenter sistem, siyasi etik, hesap verebilirlik (satır 44, 112) |
| security_state | 10 | Milli çıkar esaslı gerçekçilik, aşırı merkezi değil (satır 47) |
| secularism | 10 | Raporda doğrudan işlenmiyor; merkezci-milliyetçi sentez, düşük güvenilirlik |
| identity_migration | 20 | Millî çıkar esaslı gerçekçilik (satır 47, 114) |
| foreign_policy | 15 | Millî çıkar esaslı gerçekçilik, dengeli konum (satır 47) |
| eu_relations | -10 | Raporda net bir AB pozisyonu vurgulanmıyor, ölçülü/dengeli, düşük güvenilirlik |
| education_social_policy | -45 | Okul öncesi eğitim, fırsat eşitliği, sağlık katkı payı azaltımı (satır 46, 114) |
| environment_growth | -15 | Teknoloji ve altyapı odaklı çevresel modernizasyon (satır 49) |

### Saadet Partisi
| Eksen | Skor | Gerekçe |
|---|---|---|
| economy_market_state | 15 | Üretim ekonomisi ve adil paylaşım, devlet-piyasa dengesi net değil (satır 45, 124) |
| income_distribution | 45 | İnsan onuru, sosyal adalet ve adil paylaşım vurgusu (satır 46, 122) |
| civil_liberties | 40 | Yeni anayasa, yargı bağımsızlığı, seçim barajının kaldırılması (satır 48, 122) |
| security_state | 20 | Milli ordu vurgusu var ama güvenlik-devlet aygıtı öne çıkmıyor (satır 122) |
| secularism | 60 | Milli Görüş geleneği, dinî-ahlaki referanslı siyaset dili (satır 120, 122) |
| identity_migration | 30 | Raporda göç/kimlik özel olarak işlenmiyor; milli-muhafazakâr çizgiden türetildi, orta güvenilirlik |
| foreign_policy | 45 | "Şahsiyetli dış politika", bağımsız/inisiyatif alan çizgi (satır 47, 122, 124) |
| eu_relations | 20 | Batı karşıtlığından çok bağımsız duruş, net AB hedefi yok (satır 124) |
| education_social_policy | 20 | Eğitim ve aile merkezli ama evrensellik/seçicilik dengesi net değil (satır 46, 124) |
| environment_growth | 5 | Koruma planları ve çevreci madencilik dengesi (satır 49, 124) |

### Gelecek Partisi
| Eksen | Skor | Gerekçe |
|---|---|---|
| economy_market_state | -20 | Sürdürülebilir, kapsayıcı ve çevre dostu büyüme; piyasa dostu ama kurumsal (satır 45, 134) |
| income_distribution | 15 | Yoksullukla mücadele ve sosyal güvenlik çerçevesi, orta düzey (satır 46, 134) |
| civil_liberties | 60 | Yargı bağımsızlığı, kuvvetler ayrılığı, HSK reformu ayrıntılı işleniyor (satır 44, 48, 132) |
| security_state | -20 | Raporda güvenlik-devlet aygıtı öne çıkmıyor, hukuk/kurumsal reform öncelikli, düşük-orta güvenilirlik |
| secularism | -15 | Muhafazakâr-demokrat zeminin kurumsal restorasyonla sentezi (satır 130) |
| identity_migration | -10 | Raporda özel olarak işlenmiyor; AB çıpası ve çoğulcu kurumsal dil ile dolaylı, düşük güvenilirlik |
| foreign_policy | -35 | Çok boyutlu dış politika, bölgesel kurumsal kapasite (satır 47, 132) |
| eu_relations | -50 | AB stratejik hedef olarak açıkça korunuyor (satır 47, 132) |
| education_social_policy | 0 | Aile ekonomik/sosyal boyutları ile yoksullukla mücadele dengeli işleniyor (satır 46, 134) |
| environment_growth | -55 | Çevre ve iklim "ekolojik sorumluluk" tüm politika setinin temeli sayılıyor (satır 49, 134) |

### DEVA
| Eksen | Skor | Gerekçe |
|---|---|---|
| economy_market_state | -45 | TCMB araç bağımsızlığı, şeffaflık, piyasa dostu kurumsal çizgi (satır 45, 142, 144) |
| income_distribution | 10 | Sosyal politikalar ayrı ayrı işlenir ama yeniden dağıtım vurgusu sınırlı, düşük-orta güvenilirlik |
| civil_liberties | 65 | Kuvvetler ayrılığı, tarafsız yargı, şeffaf kurumlar merkezde (satır 44, 48, 142, 144) |
| security_state | -25 | Savunma sanayiinde dışa bağımlılığı azaltma ama merkezi güvenlik aygıtı vurgusu yok (satır 144) |
| secularism | -25 | Liberal-demokrat, piyasa dostu ama kurumsal/sosyal devleti dışlamayan çizgi (satır 142) |
| identity_migration | -20 | Raporda özel olarak işlenmiyor; liberal-kurumsal çizgiden türetildi, düşük güvenilirlik |
| foreign_policy | -30 | NATO/AB ile dengeli, kural temelli ilişki (satır 47) |
| eu_relations | -40 | Kural temelli, NATO/AB ile dengeli ilişki (satır 47, 144) |
| education_social_policy | -20 | Eğitim, sağlık, sosyal yardım ve dezavantajlı gruplar ayrı ayrı işleniyor (satır 46, 144) |
| environment_growth | -35 | Çevre dostu teknoloji ve temiz enerji (satır 49, 144) |

## Parti profil metinleri (`parties.description` güncellemesi)

Rapordaki parti bazlı analiz bölümlerinin 2-3 cümlelik tarafsız özetleri:

- **AKP**: "Muhafazakâr-demokrat çizgide, mevcut Cumhurbaşkanlığı Hükûmet Sistemi içinde yeni anayasa arayan bir parti. 2023 seçim beyannamesi yatırım, üretim, teknoloji, savunma sanayii ve dijitalleşmeyi öncelikli dosyalar olarak öne çıkarıyor."
- **CHP**: "Sosyal demokrat çizgide, güçlendirilmiş parlamenter sisteme dönüşü, yargı bağımsızlığını ve AB tam üyelik hedefini savunuyor. Vergi adaleti, planlı kalkınma ve kurumsal restorasyon programının merkezinde yer alıyor."
- **HDP**: "Çoğulculuk, halkların eşitliği, kadın özgürlüğü ve yerel demokrasi ekseninde bir parti; 2023 seçiminde oyları Yeşil Sol Parti listesine yönlendirdi. İklim adaleti, ademimerkeziyetçilik ve yargı reformu programının belirleyici unsurları arasında."
- **MHP**: "Milliyetçi-devletçi çizgide, Cumhurbaşkanlığı Hükûmet Sistemi'nin devamını ve güçlü/merkezi bir devlet yapısını savunuyor. 2024 parti programı millî üretim, ekonomik güvenlik ve savunma-teknoloji önceliklerini vurguluyor."
- **İYİ Parti**: "Merkezcilik ve milliyetçiliği birleştiren, güçlendirilmiş parlamenter sistem ve kuvvetler ayrılığını savunan bir parti. Program makroekonomik istikrar, TCMB bağımsızlığı ve yerel yönetim reformuna ayrıntılı yer veriyor."
- **Saadet**: "Milli Görüş geleneğini çağdaş bir siyasal programla sürdüren parti; adil hukuk düzeni, üretime dayalı ekonomi ve 'şahsiyetli dış politika' kavramlarını öne çıkarıyor. Yeni anayasa ve seçim barajının kaldırılmasını savunuyor."
- **Gelecek**: "Muhafazakâr-demokrat kökenden kurumsal restorasyon, hukukun üstünlüğü ve AB çıpasına dayalı bir sentez sunan parti. Dijital dönüşüm ve çevresel sorumluluk programının öne çıkan başlıkları arasında."
- **DEVA**: "Liberal-demokrat, piyasa dostu fakat kurumsal ve sosyal devlet boyutlarını dışlamayan bir çizgi izleyen parti. Program TCMB bağımsızlığı, şeffaflık, vergi reformu ve güçlendirilmiş parlamenter sistemi teknik ayrıntıyla ele alıyor."

Kaynak: `yeni_deep-research-report.md` (2026-07-20 tarihli rapor).
