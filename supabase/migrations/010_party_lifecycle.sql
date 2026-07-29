-- Parti yaşam döngüsü: kapanan partiler ve isim değişiklikleri.
--
-- Anket, var olmayan bir partiyi eşleştirmeye sokmamalı ve partileri güncel
-- adlarıyla göstermelidir. İki somut sorun tespit edildi:
--
--   * Memleket Partisi 22 Temmuz 2025'te olağanüstü kongre kararıyla kapandı
--     ve üyeleri CHP'ye katıldı.
--   * Yeşil Sol Parti, Ekim–Aralık 2023'te "Halkların Eşitlik ve Demokrasi
--     Partisi" (DEM Parti) adını aldı. HDP'nin 2023 seçimlerinde kullandığı
--     liste bu partiydi; siyasi hat aynı, ad değişti.
--
-- Parti satırı silinmiyor: geçmiş oturumların sonuç anlık görüntüleri parti
-- id'lerine atıf yapıyor ve silme onları çözümsüz bırakırdı.

ALTER TABLE parties ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS dissolved_at DATE;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS dissolution_note TEXT;

CREATE INDEX IF NOT EXISTS idx_parties_active ON parties(is_active);

-- Memleket Partisi: kapandı.
UPDATE parties
SET is_active = false,
    dissolved_at = DATE '2025-07-22',
    dissolution_note = 'Olağanüstü kongre kararıyla kapatıldı; üyeleri CHP''ye katıldı.'
WHERE short_name = 'Memleket';

-- Yeşil Sol Parti -> DEM Parti (ad değişikliği, aynı siyasi hat).
UPDATE parties
SET name = 'Halkların Eşitlik ve Demokrasi Partisi',
    short_name = 'DEM',
    description = 'Çoğulculuk, halkların eşitliği, kadın özgürlüğü ve yerel demokrasi ekseninde bir parti. '
                  'HDP çizgisinin devamı; 2023 seçimlerine Yeşil Sol Parti listesiyle girildi, '
                  'parti Aralık 2023''te bugünkü adını aldı.'
WHERE short_name = 'YSP';
