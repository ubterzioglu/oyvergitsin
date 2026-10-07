import type { Config } from 'tailwindcss'

/**
 * Tasarım yönü: "Kamusal Ekran" (B9 kararı, docs/design-direction-options.md §2, §7).
 *
 * Grafit kabuk + tek vurgu rengi (petrol #0E6E7D) + veri etiketlerinde mono.
 * Rainbow paleti bırakıldı: eski 6 accent'in 6'sı da bir parti renginden
 * ayırt edilemiyordu (hue farkı 1.9°–20.5°, hepsi 30° eşiğinin altında).
 * Tarafsızlık iddia eden bir platformda kabuk hiçbir partiyle aynı renkte
 * konuşamaz. Renk bundan sonra yalnızca parti verisinde anlam taşır.
 */
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#F7F8F8',
          card: '#FFFFFF',
          muted: '#EFF1F1',
        },
        // Üçü de küçük metinde WCAG AA geçer (beyaz kart üzerinde 17.13 /
        // 6.38 / 4.79). Tasarım belgesindeki ink-muted #828B8D idi ama
        // beyazda 3.48 veriyor — "yardımcı etiket" küçük metin demek, bu
        // oran AA'yı geçmiyordu. #6B7476'ya koyulaştırıldı.
        ink: {
          primary: '#191C1E',
          secondary: '#566164',
          muted: '#6B7476',
        },
        border: {
          DEFAULT: '#DDE3E3',
          strong: '#C3CDCD',
        },
        accent: {
          DEFAULT: '#0E6E7D',
          hover: '#0B5A66',
          tint: '#E1F0F2',
        },

        /**
         * Sıralı (ordinal) ölçekler için rampa.
         *
         * Likert ölçeği ve kapsama rozeti gibi yerlerde renk bilgi taşıyor;
         * adımların ayırt edilebilmesi gerekiyor. Hepsini tek accent'e
         * indirmek bu bilgiyi yok ederdi. Rampa açık nötrden petrole uzanır.
         *
         * Adımlar parlaklığa göre ARALIKLANDIRILDI, göz kararı seçilmedi:
         * komşu adımların birbirine kontrastı 1.32–1.39, uçtan uca 4.56.
         * (İlk denemede adımlar 1.03'e kadar sıkışıyordu — yani scale-4 ile
         * scale-5 pratikte aynı renkti.)
         *
         * DOLGU ÜZERİNE METİN — hangi adımda ne kullanılacağı:
         *   scale-1 #C6D2D3  ink 11.06  → ink
         *   scale-2 #9BB6B9  ink  7.98  → ink
         *   scale-3 #769DA2  ink  5.80  → ink
         *   scale-4 #55868E  ink 4.23 / beyaz 4.05 → KÜÇÜK METİN KOYMA
         *   scale-5 #38737C  beyaz 5.37 → beyaz
         *   scale-6 #1D616B  beyaz 7.06 → beyaz
         *
         * Komşu adımlar 1.3 civarında, yani YAKIN. Sıralı bilgi RENGE TEK
         * BAŞINA bırakılmamalı; B11 ve sonrası etiket/konum/ikon gibi ikinci
         * bir ayırt edici eklemek zorunda (planın erişilebilirlik kuralı:
         * "grafiklerde renk tek ayırt edici olmasın").
         */
        scale: {
          1: '#C6D2D3',
          2: '#9BB6B9',
          3: '#769DA2',
          4: '#55868E',
          5: '#38737C',
          6: '#1D616B',
        },


      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
        // Yalnızca veri için: soru sayacı, yüzdeler, eksen numaraları,
        // last_verified_at. "Doğrulanmış kamu verisi" hissi buradan geliyor.
        // Harici font yok — next/font gerekmiyor, sıfır ağ maliyeti.
        data: ['var(--font-data)'],
      },
      borderRadius: {
        card: '0.625rem',
        button: '0.5rem',
        badge: '0.25rem',
      },
      boxShadow: {
        // Kartlar gölgeyle değil 1px kenarlıkla ayrılıyor; gölge yalnızca
        // hover'da devreye giriyor.
        soft: '0 1px 2px rgba(25,28,30,0.05)',
        elevated: '0 2px 6px rgba(25,28,30,0.08), 0 8px 24px rgba(25,28,30,0.05)',
      },
    },
  },
  plugins: [],
}
export default config
