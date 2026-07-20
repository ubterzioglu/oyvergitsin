# Oy Ver Gitsin — Kalan Partiler İçin Araştırma Girdisi (Takip Görevi)

Bu doküman, `docs/research-input.md` ile aynı şemayı kullanarak uygulamadaki 12 partiden
`yeni_deep-research-report.md` kapsamı dışında kalan **4 parti** için parti profili ve
parti×eksen skor matrisini doldurmak üzere hazırlanmıştır.

**Not:** DB'de ayrı bir "HDP" satırı yok — HDP 2023 seçiminde oylarını Yeşil Sol Parti
(YSP) listesine yönlendirdi, bu yüzden raporun "HDP–Yeşil Sol hattı" analizi doğrudan
**YSP** satırına uygulandı (bkz. `docs/party-positions-2026-update.md`). Bu nedenle YSP
artık bu takip listesinde değil, önceki sürümde yer alıyordu.

**Durum:** Bu tur henüz çalıştırılmadı — kullanıcının bu dosyayı bir Deep Research
oturumuna vermesi bekleniyor. Doldurulmuş sonuç geri geldiğinde,
`docs/party-positions-2026-update.md` ile aynı yöntemle `scripts/update-party-positions.js`
(veya türetilecek yeni bir script) aracılığıyla DB'ye entegre edilecek.

## Nasıl kullanılır

1. Bu dosyanın tamamını Deep Research'e yapıştır.
2. Aynı JSON şemasını, sadece aşağıdaki 5 parti için doldurmasını iste.
3. Doldurulmuş JSON'ları `scripts/update-party-positions.js`'e (veya benzer bir script'e)
   entegre etmek üzere geri getir.

## Eksen kutup tanımları (sabit — `docs/party-positions-2026-update.md` ile aynı)

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

## Kapsanacak partiler ve profil şablonu

```json
{
  "parties": [
    { "short_name": "TİP", "name": "Türkiye İşçi Partisi", "description": "TAMAMLA: 2-3 cümlelik güncel, tarafsız parti profili" },
    { "short_name": "Vatan", "name": "Vatan Partisi", "description": "TAMAMLA" },
    { "short_name": "Zafer", "name": "Zafer Partisi", "description": "TAMAMLA" },
    { "short_name": "Memleket", "name": "Memleket Partisi", "description": "TAMAMLA" }
  ]
}
```

## Parti × Eksen Pozisyon Matrisi (4 parti × 10 eksen = 40 hücre)

```json
{
  "party_positions": {
    "TİP": {
      "economy_market_state": { "score": null, "rationale": "", "sources": [] },
      "income_distribution": { "score": null, "rationale": "", "sources": [] },
      "civil_liberties": { "score": null, "rationale": "", "sources": [] },
      "security_state": { "score": null, "rationale": "", "sources": [] },
      "secularism": { "score": null, "rationale": "", "sources": [] },
      "identity_migration": { "score": null, "rationale": "", "sources": [] },
      "foreign_policy": { "score": null, "rationale": "", "sources": [] },
      "eu_relations": { "score": null, "rationale": "", "sources": [] },
      "education_social_policy": { "score": null, "rationale": "", "sources": [] },
      "environment_growth": { "score": null, "rationale": "", "sources": [] }
    },
    "Vatan": { "...": "TİP ile aynı 10 eksen anahtarını kullan" },
    "Zafer": { "...": "aynı yapı" },
    "Memleket": { "...": "aynı yapı" }
  }
}
```

**Talimat (Deep Research'e):**
- 4 parti × 10 eksen = 40 hücrenin tamamını doldur.
- Her hücrede `score`: -100..+100 arası tam sayı (yukarıdaki eksen tanımlarındaki kutup
  anlamlarına göre).
- `rationale`: skorun neden verildiğine dair 1 cümlelik gerekçe.
- `sources`: mümkünse parti programı, resmi açıklama, oylama kaydı, güvenilir haber kaynağı.
- Kaynak bulunamayan eksenlerde `"sources": []` bırak ama `rationale` içinde "tahmini,
  doğrudan kaynak bulunamadı" diye belirt.
- Yanıtını tam JSON olarak, `"..."` kısaltmaları olmadan geri ver.

## Mevcut kod bağlamı (referans)

- Skorlama mantığı: `lib/scoring/engine.ts` — kullanıcı cevaplarına göre her eksen için
  puanlar toplanır, [-100, 100] aralığına sıkıştırılır.
- Bu 4 parti şu anda DB'de `scripts/seed.js`'ten gelen rastgele (`Math.random()`)
  `party_positions.score` değerlerine sahip; bu tur tamamlanana kadar öyle kalacaklar.
- YSP, AKP, CHP, MHP, İYİ, Saadet, Gelecek, DEVA skorları zaten
  `scripts/update-party-positions.js` ile güncellendi (bkz. `docs/party-positions-2026-update.md`).
- Entegrasyon deseni için bkz. `docs/party-positions-2026-update.md` ve
  `scripts/update-party-positions.js`.
