# YENI Parti Araştırma Notu ve Skor Gerekçesi

Tarih: 25 Temmuz 2026

Bu not, BBC Türkçe'nin `https://www.bbc.com/turkce/articles/c0jlnyg5v8po` bağlantılı haberi
sonrası `YENİ PARTİ` kaydının veri tabanına eklenmesi ve 10 eksenli eşleşme modelinde
konumlandırılması için hazırlandı. Uygulama script'i: `scripts/update-party-positions.js`.

## Kaynak Özeti

- Yargıtay Cumhuriyet Başsavcılığı siyasi parti listesinde `YENİ PARTİ`, kısa adı `YENİ PARTİ`,
  kuruluş tarihi `24.07.2026` olarak yer alıyor.
  Kaynak: https://www.yargitaycb.gov.tr/sipar/365
- BBC Türkçe bağlantısı, RSS yansımalarında Özgür Özel ve 90 milletvekilinin CHP'den ayrılarak
  Yeni Parti'nin kuruluş evraklarını imzalaması ve İçişleri Bakanlığı başvurusu bağlamında
  indekslenmiş görünüyor.
  Kaynak: https://www.bbc.com/turkce/articles/c0jlnyg5v8po
- Habertürk ve DHA aynı ana olayı, `91 milletvekili`, İçişleri Bakanlığı başvurusu ve Özgür Özel'in
  genel başkan seçilmesi ayrıntılarıyla doğruluyor.
  Kaynaklar:
  https://www.haberturk.com/gundem/son-dakika-haberi-yeni-partide-son-gelismeler-imzalar-toplaniyor-yeni-parti-ne-zaman-kurulacak-3900692
  https://www.dha.com.tr/politika/ozgur-ozelin-partisinin-adi-yeni-parti-oldu-2915156
- Partinin resmi program PDF'i `24/07/2026` tarihli ve `Ortak Gelecek İçin` başlığıyla yayımlandı.
  Kaynak: https://yeni-parti.org/assets/docs/parti-programi.pdf
- Programın beş ana bölümü: değişim çağrısı; demokrasi, yönetim ve adalet; kalkınma ve ekonomi;
  sosyal devlet; dış politika, güvenlik ve dirençlilik.
  Kaynak: https://haber.sol.org.tr/haber/yeni-parti-program-ve-tuzugu-yayimlandi-412080

## Programdan Çıkan Ana Pozisyonlar

- Kurumsal demokrasi: Program güçlü Meclis, kuvvetler ayrılığı, parlamenter sistem, tarafsız
  cumhurbaşkanlığı, bağımsız yargı, AİHS/AİHM standartları, basın ve ifade özgürlüğü vurguluyor.
- Ekonomi: Piyasa kurumlarını tümüyle reddetmeyen, ancak kamucu, planlamacı, kalkınmacı devlet
  ve sosyal devlet ağırlığı yüksek bir sosyal demokrat ekonomi çizgisi var.
- Gelir dağılımı ve sosyal politika: Yoksulluk, güvencesizlik, barınma, enerji, eğitim, sağlık,
  bakım hizmetleri, toplumsal cinsiyet eşitliği ve sosyal güvenlik geniş bir hak paketi olarak
  ele alınıyor.
- Kimlik ve çoğulculuk: Eşit yurttaşlık, ayrımcılıkla mücadele, cemevleri, ana dil hakkı ve
  İstanbul Sözleşmesi vurguları çoğulcu çizgiyi güçlendiriyor.
- Göç ve güvenlik: Hak temelli dil korunurken düzensiz göçe karşı sıfır tolerans, sınır güvenliği
  ve gönüllü geri dönüş politikaları nedeniyle kimlik/göç ekseninde CHP'ye yakın ama daha temkinli
  bir skor verildi.
- Dış politika ve AB: Çok taraflı, diplomasi merkezli dış politika; Batı ittifakı içinde etkinlik;
  AB üyelik sürecinin hızlandırılması ve demokratik reform vaadi belirgin.
- Çevre: Temiz çevre hakkı, iklim krizi, yeşil kentler, afet dirençliliği ve dönüşüm başlıkları
  çevre önceliğini CHP çizgisinden biraz daha yüksek konumlandırıyor.

## Skor Matrisi

Eksen konvansiyonu `docs/party-positions-2026-update.md` ile aynıdır.

| Eksen | Skor | Gerekçe |
|---|---:|---|
| economy_market_state | 25 | Kamucu/kalkınmacı devlet ve planlama vurgusu var; piyasa tümüyle reddedilmiyor. |
| income_distribution | 65 | Güçlü sosyal devlet, yoksullukla mücadele, sosyal güvenlik ve hak temelli transferler öne çıkıyor. |
| civil_liberties | 75 | Parlamenter sistem, yargı bağımsızlığı, ifade-basın-örgütlenme özgürlüğü ve AİHM uyumu güçlü. |
| security_state | 5 | Güvenlik kapasitesini güçlendirme var; demokratik denetim ve hak temelli kolluk dili skoru dengeliyor. |
| secularism | -45 | Cumhuriyet/Altı Ok/laiklik mirası, cemevleri ve İstanbul Sözleşmesi vurgusu belirgin. |
| identity_migration | -25 | Eşit yurttaşlık ve çoğulculuk güçlü; düzensiz göçe sıfır tolerans nedeniyle daha merkezde. |
| foreign_policy | -30 | Çok taraflı, diplomasi ve ittifak temelli dış politika; ulusal çıkar dili de korunuyor. |
| eu_relations | -60 | AB üyelik sürecini hızlandırma ve demokratik reformlar açık hedef olarak yazılmış. |
| education_social_policy | -55 | Eğitim, sağlık, barınma, enerji ve bakım hizmetleri hak temelli/kamusal çerçevede. |
| environment_growth | -45 | Temiz çevre hakkı, iklim krizi, dirençlilik ve yeşil kent yaklaşımı büyümeye göre öne çıkıyor. |

## Uygulama Kararı

- `parties.short_name`: `YENİ PARTİ`
- `parties.name`: `YENİ Parti`
- `parties.color`: `#E41E26`
- `news_posts.original_url`: `https://www.bbc.com/turkce/articles/c0jlnyg5v8po`
- `news_posts.status`: `active`
