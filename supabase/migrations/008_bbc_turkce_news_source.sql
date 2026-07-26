-- BBC Turkce RSS kaynagini radar haber pipeline'ina ekler.
-- Kullanici https://www.bbc.com/turkce/articles/c0jlnyg5v8po adresindeki
-- bir haberi manuel eklemek istedi; makale icerigine bu ortamdan erisilemedi
-- (WebFetch/WebSearch bbc.com'a ulasamiyor), bu yuzden tek bir haberi
-- uydurmak yerine BBC Turkce'yi kalici bir RSS kaynagi olarak tanimliyoruz.
-- Sonraki radar taramasi bu makaleyi (ve guncel BBC Turkce haberlerini)
-- otomatik olarak aday kuyruguna dusurur; admin /admin/radar ekranindan
-- onaylar. terms_checked=false ve is_enabled=false ile eklenir — admin
-- BBC'nin kullanim sartlarini/RSS politikasini onayladiktan sonra
-- /admin/radar/sources ekranindan etkinlestirmelidir.

BEGIN;

INSERT INTO news_sources (
  name, source_type, endpoint_url, website_url, language, country,
  category_default, trust_level, is_enabled, terms_checked
)
SELECT
  'BBC Türkçe',
  'rss',
  'https://feeds.bbci.co.uk/turkce/rss.xml',
  'https://www.bbc.com/turkce',
  'tr',
  'GB',
  'siyaset',
  'high',
  false,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM news_sources WHERE endpoint_url = 'https://feeds.bbci.co.uk/turkce/rss.xml'
);

COMMIT;
