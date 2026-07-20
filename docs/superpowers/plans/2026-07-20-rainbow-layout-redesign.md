# Rainbow Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace oyvergitsin.org's navy/red/gold brand identity with a 6-color rainbow palette across the entire site, remove the header logo, and switch all typography to an Apple system-font stack.

**Architecture:** Add new `rainbow` color tokens (6 base colors + pastel tints + a `blue-hover` shade) to `tailwind.config.ts` alongside a system-font stack, then mechanically swap every `brand-ink`/`brand-accent`/`brand-accent-hover` class usage across the codebase for the new tokens, restyle the homepage section-by-section with per-section pastel backgrounds and cycling card accents, and remove the header logo image. No new dependencies, no logic changes — pure styling/token migration.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS, TypeScript, no test runner configured for this repo — verification is via `tsc --noEmit`, `next build`, and manual visual check on `next dev`.

## Global Constraints

- Rainbow palette (exact hex, from spec): yellow `#F5C518`, orange `#F5821F`, red `#E8385C`, purple `#7B4FE0`, blue `#1E9BE0`, green `#3CB043`.
- Pastel tint target lightness ~95% L for all six tints, so section backgrounds read as consistently "light" regardless of hue.
- `brand-ink` and `brand-accent`/`brand-accent-hover` tokens are removed entirely from `tailwind.config.ts` once every call site is migrated — zero remaining references is the exit criterion (spec: "Testing / Verification").
- Sitewide primary interactive color (buttons, links, focus rings, active states) → `rainbow-blue` / `rainbow-blue-hover`. Solid dark backgrounds/text that used `brand-ink` → `ink-primary` (`#1A1D23`, already exists, no new token).
- Font: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif` for both heading and body — no Google Fonts.
- Card accent colors cycle through `[yellow, orange, red, purple, blue, green]` by array index modulo 6.
- Out of scope: survey question content/logic, admin functionality, legal page text, results pages content, favicon/manifest/opengraph images, hero video file itself and its `poster="/logo.png"` attribute.

---

### Task 1: Add rainbow color tokens and Apple font stack to Tailwind config

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: Tailwind color tokens `rainbow-yellow`, `rainbow-orange`, `rainbow-red`, `rainbow-purple`, `rainbow-blue`, `rainbow-green`, `rainbow-blue-hover`, `rainbow-yellow-tint`, `rainbow-orange-tint`, `rainbow-red-tint`, `rainbow-purple-tint`, `rainbow-blue-tint`, `rainbow-green-tint` — later tasks reference these class names directly (e.g. `bg-rainbow-yellow-tint`, `text-rainbow-blue`, `border-rainbow-blue`).
- Produces: `fontFamily.heading` and `fontFamily.body` both resolving to the Apple system stack.

- [ ] **Step 1: Replace the `brand` color block with `rainbow` tokens in `tailwind.config.ts`**

Read the current file first (already read in this session — content below is the full replacement). Replace the entire `colors` object:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rainbow: {
          yellow: '#F5C518',
          'yellow-tint': '#FDF6DC',
          orange: '#F5821F',
          'orange-tint': '#FDEBDA',
          red: '#E8385C',
          'red-tint': '#FBDEE4',
          purple: '#7B4FE0',
          'purple-tint': '#EBE3FA',
          blue: '#1E9BE0',
          'blue-tint': '#DDF0FB',
          'blue-hover': '#1580BD',
          green: '#3CB043',
          'green-tint': '#DFF3E0',
        },
        surface: {
          DEFAULT: '#FAFBFC',
          card: '#FFFFFF',
          muted: '#F1F3F6',
        },
        ink: {
          primary: '#1A1D23',
          secondary: '#5A6270',
          muted: '#8B919A',
        },
        border: {
          DEFAULT: '#E2E5EA',
          strong: '#CBD0D7',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
      },
      borderRadius: {
        card: '1rem',
        button: '0.625rem',
        badge: '0.375rem',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.06), 0 6px 16px rgba(0,0,0,0.04)',
        elevated: '0 2px 8px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 2: Add the Apple font stack CSS variables and a reusable rainbow-gradient utility class to `app/globals.css`**

Replace the full file content:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-heading: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  --font-body: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
}

body {
  color: #1A1D23;
  background-color: #FAFBFC;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .rainbow-gradient-border {
    background-image: linear-gradient(
      90deg,
      #F5C518 0%,
      #F5821F 20%,
      #E8385C 40%,
      #7B4FE0 60%,
      #1E9BE0 80%,
      #3CB043 100%
    );
  }
}
```

- [ ] **Step 3: Verify Tailwind picks up the new config with no errors**

Run: `npx tsc --noEmit`
Expected: no new errors related to `tailwind.config.ts` (pre-existing unrelated errors, if any, are not in scope — note them but don't fix).

Run: `npm run build 2>&1 | head -n 60` (in Bash) or `npm run build 2>&1 | Select-Object -First 60` (in PowerShell)
Expected: build fails at this point because component files still reference the now-removed `brand-ink`/`brand-accent` classes — Tailwind itself won't error (unknown utility classes are silently dropped, not a build failure), but this is expected; do not attempt to fix downstream files in this task. Confirm specifically that there is no error mentioning `tailwind.config.ts` or `globals.css`.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts app/globals.css
git commit -m "feat: add rainbow color tokens and Apple font stack to Tailwind config"
```

---

### Task 2: Migrate shared UI primitives (Button, ProgressBar) to rainbow tokens

**Files:**
- Modify: `components/ui/Button.tsx`
- Modify: `components/ui/ProgressBar.tsx`

**Interfaces:**
- Consumes: `bg-rainbow-blue`, `bg-rainbow-blue-hover` Tailwind classes from Task 1.
- Produces: `Button` primary variant and `ProgressBar` fill now render with `rainbow-blue` — every later task/page using `<Button variant="primary">` or `<ProgressBar>` inherits this automatically, no changes needed at call sites.

- [ ] **Step 1: Update `components/ui/Button.tsx` primary variant**

Change line 10-11 from:

```typescript
  primary:
    'bg-brand-accent text-brand-ink hover:bg-brand-accent-hover shadow-soft',
```

to:

```typescript
  primary:
    'bg-rainbow-blue text-white hover:bg-rainbow-blue-hover shadow-soft',
```

- [ ] **Step 2: Update `components/ui/ProgressBar.tsx` fill color**

Change line 11 from:

```typescript
          className="h-full bg-brand-accent transition-all duration-300"
```

to:

```typescript
          className="h-full bg-rainbow-blue transition-all duration-300"
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: no new errors from these two files.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Button.tsx components/ui/ProgressBar.tsx
git commit -m "feat: migrate Button and ProgressBar to rainbow-blue accent"
```

---

### Task 3: Migrate Header and Footer — remove logo, add rainbow gradient border, new fonts

**Files:**
- Modify: `components/layout/Header.tsx`
- Modify: `components/layout/Footer.tsx`

**Interfaces:**
- Consumes: `rainbow-gradient-border` utility class (Task 1), `ink-primary` existing token, `rainbow-blue`/`rainbow-blue-hover` (Task 1).
- Produces: no exports change — `Header`/`Footer` remain default page-shell components consumed by `app/layout.tsx` (untouched call site).

- [ ] **Step 1: Rewrite `components/layout/Header.tsx` — remove logo image, add gradient border**

Replace full file content:

```typescript
import Link from 'next/link'
import { siteConfig } from '@/lib/site'

export function Header() {
  return (
    <header className="rainbow-gradient-border sticky top-0 z-40 border-b-[3px] border-transparent bg-white bg-clip-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-xl font-bold leading-none text-ink-primary">
            {siteConfig.shortName}
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-ink-secondary">
          <Link href="/consent" className="transition-colors hover:text-ink-primary">
            Anketi Başlat
          </Link>
        </nav>
      </div>
    </header>
  )
}
```

Note: `bg-clip-border` + gradient-as-background won't visually render as a "gradient border" using plain Tailwind utilities on a `border-b`. Use this simpler, correct approach instead — a 3px gradient div positioned at the bottom of the header:

```typescript
import Link from 'next/link'
import { siteConfig } from '@/lib/site'

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-xl font-bold leading-none text-ink-primary">
            {siteConfig.shortName}
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-ink-secondary">
          <Link href="/consent" className="transition-colors hover:text-ink-primary">
            Anketi Başlat
          </Link>
        </nav>
      </div>
      <div className="rainbow-gradient-border h-[3px] w-full" aria-hidden="true" />
    </header>
  )
}
```

Use this second version (the div-based gradient bar) as the actual implementation — it's simpler and renders correctly with the `rainbow-gradient-border` utility class defined in Task 1, which sets `background-image`.

- [ ] **Step 2: Rewrite `components/layout/Footer.tsx` — dark neutral background, gradient top border, rainbow-blue links**

Replace full file content:

```typescript
import Link from 'next/link'
import { siteConfig } from '@/lib/site'

const LEGAL_LINKS = [
  { href: '/legal/privacy-policy', label: 'Gizlilik Politikası' },
  { href: '/legal/terms-of-use', label: 'Kullanım Şartları' },
  { href: '/legal/kvkk-disclosure', label: 'KVKK Aydınlatma Metni' },
  { href: '/legal/cookie-policy', label: 'Çerez Politikası' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-ink-primary text-white/80">
      <div className="rainbow-gradient-border h-[3px] w-full" aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 pt-4 text-sm font-medium tracking-wide text-white/70">
        {LEGAL_LINKS.map((link, index) => (
          <span key={link.href} className="flex items-center gap-x-4">
            {index > 0 && <span className="h-4 w-px bg-white/20" aria-hidden="true" />}
            <Link
              href={link.href}
              className="underline underline-offset-4 transition-colors hover:text-rainbow-blue"
            >
              {link.label}
            </Link>
          </span>
        ))}
      </div>
      <div className="mx-auto mt-4 max-w-6xl border-t border-white/20 px-4 py-1.5 text-center text-[9px] leading-snug text-white/50">
        <span className="font-heading font-semibold text-white/80">{siteConfig.shortName}</span>
        {' · '}
        Türkiye Siyasi Eşleşme Platformu
        {' · '}
        Faydali baglanti:{' '}
        <a
          href="https://ufuksoynakliyat.com.tr/pendik-evden-eve-nakliyat"
          rel="dofollow"
          target="_blank"
          className="font-medium text-rainbow-blue underline underline-offset-4 transition-colors hover:text-rainbow-blue-hover"
          title="Pendik Evden Eve Nakliyat - Ufuksoy Nakliyat A.Ş."
          aria-label="Pendik Evden Eve Nakliyat Firması Ufuksoy Nakliyat A.Ş."
        >
          Pendik Evden Eve Nakliyat
        </a>{' '}
        Firması Ufuksoy Nakliyat A.Ş.
        {' · '}
        © {year} {siteConfig.shortName}. Tüm hakları saklıdır.
      </div>
    </footer>
  )
}
```

Note: the original footer used `border-brand-accent/30` (a semi-transparent border) as the divider above the copyright line — replaced here with `border-white/20` (a neutral divider) since the copyright divider isn't a brand-color element in the redesign, just a structural separator.

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: no new errors from these two files.

- [ ] **Step 4: Commit**

```bash
git add components/layout/Header.tsx components/layout/Footer.tsx
git commit -m "feat: remove header logo, add rainbow gradient border to header/footer"
```

---

### Task 4: Migrate admin components and pages to rainbow tokens

**Files:**
- Modify: `components/admin/AdminNav.tsx`
- Modify: `components/admin/FormField.tsx`
- Modify: `app/admin/login/page.tsx`

**Interfaces:**
- Consumes: `bg-ink-primary`, `border-rainbow-blue` classes from Task 1.

- [ ] **Step 1: Update `components/admin/AdminNav.tsx`**

Change line 32 from:

```typescript
    <nav className="bg-brand-ink shadow-md">
```

to:

```typescript
    <nav className="bg-ink-primary shadow-md">
```

- [ ] **Step 2: Update `components/admin/FormField.tsx`**

Change line 25 from:

```typescript
const INPUT_CLASSES =
  'w-full rounded-lg border border-border px-4 py-2 text-ink-primary focus:border-brand-accent focus:outline-none'
```

to:

```typescript
const INPUT_CLASSES =
  'w-full rounded-lg border border-border px-4 py-2 text-ink-primary focus:border-rainbow-blue focus:outline-none'
```

- [ ] **Step 3: Update `app/admin/login/page.tsx`**

Change line 70 from:

```typescript
            className="w-full rounded-lg border border-border px-4 py-2 text-ink-primary focus:border-brand-accent focus:outline-none"
```

to:

```typescript
            className="w-full rounded-lg border border-border px-4 py-2 text-ink-primary focus:border-rainbow-blue focus:outline-none"
```

Change line 84 (identical pattern, password field) from:

```typescript
            className="w-full rounded-lg border border-border px-4 py-2 text-ink-primary focus:border-brand-accent focus:outline-none"
```

to:

```typescript
            className="w-full rounded-lg border border-border px-4 py-2 text-ink-primary focus:border-rainbow-blue focus:outline-none"
```

- [ ] **Step 4: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: no new errors from these three files.

- [ ] **Step 5: Commit**

```bash
git add components/admin/AdminNav.tsx components/admin/FormField.tsx app/admin/login/page.tsx
git commit -m "feat: migrate admin nav, form fields, and login page to rainbow tokens"
```

---

### Task 5: Migrate survey page, legal pages, and LatestNews to rainbow tokens

**Files:**
- Modify: `app/survey/page.tsx`
- Modify: `app/legal/layout.tsx`
- Modify: `app/legal/cookie-policy/page.tsx`
- Modify: `app/legal/privacy-policy/page.tsx`
- Modify: `app/legal/kvkk-disclosure/page.tsx`
- Modify: `app/legal/terms-of-use/page.tsx`
- Modify: `components/home/LatestNews.tsx`

**Interfaces:**
- Consumes: `border-rainbow-blue`, `text-rainbow-blue`, `hover:text-rainbow-blue-hover`, `bg-rainbow-blue-tint` classes from Task 1.

- [ ] **Step 1: Update `app/survey/page.tsx` selected-option state**

Change line 178-182 from:

```typescript
                className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                  answers[question.id] === option.value
                    ? 'border-brand-accent bg-surface-muted'
                    : 'border-border hover:border-border-strong'
                }`}
```

to:

```typescript
                className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                  answers[question.id] === option.value
                    ? 'border-rainbow-blue bg-surface-muted'
                    : 'border-border hover:border-border-strong'
                }`}
```

- [ ] **Step 2: Update `app/legal/layout.tsx`**

Change line 24 from:

```typescript
            <Link href="/" className="text-brand-accent underline underline-offset-4 hover:text-brand-accent-hover">
```

to:

```typescript
            <Link href="/" className="text-rainbow-blue underline underline-offset-4 hover:text-rainbow-blue-hover">
```

- [ ] **Step 3: Update `app/legal/cookie-policy/page.tsx`**

Change line 60 from:

```typescript
              className="text-brand-accent underline underline-offset-4 hover:text-brand-accent-hover"
```

to:

```typescript
              className="text-rainbow-blue underline underline-offset-4 hover:text-rainbow-blue-hover"
```

- [ ] **Step 4: Update `app/legal/privacy-policy/page.tsx` (two occurrences, lines 67 and 95)**

Change both line 67 and line 95 from:

```typescript
              className="text-brand-accent underline underline-offset-4 hover:text-brand-accent-hover"
```

to:

```typescript
              className="text-rainbow-blue underline underline-offset-4 hover:text-rainbow-blue-hover"
```

- [ ] **Step 5: Update `app/legal/kvkk-disclosure/page.tsx` (two occurrences, lines 32 and 108)**

Change both line 32 and line 108 from:

```typescript
              className="text-brand-accent underline underline-offset-4 hover:text-brand-accent-hover"
```

to:

```typescript
              className="text-rainbow-blue underline underline-offset-4 hover:text-rainbow-blue-hover"
```

- [ ] **Step 6: Update `app/legal/terms-of-use/page.tsx`**

Change line 87 from:

```typescript
              className="text-brand-accent underline underline-offset-4 hover:text-brand-accent-hover"
```

to:

```typescript
              className="text-rainbow-blue underline underline-offset-4 hover:text-rainbow-blue-hover"
```

- [ ] **Step 7: Update `components/home/LatestNews.tsx` — link hover color and section background**

Change line 62 from:

```typescript
    <section className="bg-surface py-20">
```

to:

```typescript
    <section className="bg-rainbow-blue-tint py-20">
```

Change line 74 from:

```typescript
                className="text-base font-semibold text-ink-primary hover:text-brand-accent"
```

to:

```typescript
                className="text-base font-semibold text-ink-primary hover:text-rainbow-blue"
```

- [ ] **Step 8: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: no new errors from any of these seven files.

- [ ] **Step 9: Commit**

```bash
git add app/survey/page.tsx app/legal/layout.tsx app/legal/cookie-policy/page.tsx app/legal/privacy-policy/page.tsx app/legal/kvkk-disclosure/page.tsx app/legal/terms-of-use/page.tsx components/home/LatestNews.tsx
git commit -m "feat: migrate survey, legal pages, and LatestNews to rainbow tokens"
```

---

### Task 6: Remove Google Fonts from root layout, confirm font stack applies globally

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `--font-heading`/`--font-body` CSS variables set in `app/globals.css` (Task 1) — this task removes the old `next/font/google` variable assignment so the CSS-level defaults from Task 1 take effect unopposed.

- [ ] **Step 1: Remove `next/font/google` import and usage from `app/layout.tsx`**

Change lines 1-10 from:

```typescript
import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import Script from 'next/script'
import { getSiteUrl, siteConfig } from '@/lib/site'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-heading' })
```

to:

```typescript
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { getSiteUrl, siteConfig } from '@/lib/site'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'
```

- [ ] **Step 2: Update the `<body>` className to drop the removed font variables**

Change line 137 from:

```typescript
      <body className={`${inter.variable} ${sourceSerif.variable} font-body`}>
```

to:

```typescript
      <body className="font-body">
```

The `--font-heading`/`--font-body` CSS custom properties are now set globally in `app/globals.css` (`:root` block from Task 1) rather than per-request by `next/font`, so no variable class names are needed on `<body>` anymore — `font-body` (Tailwind utility) still resolves correctly via `tailwind.config.ts`'s `fontFamily.body: ['var(--font-body)']`.

- [ ] **Step 3: Verify no type errors and confirm font loads correctly**

Run: `npx tsc --noEmit`
Expected: no new errors.

Run: `npm run build`
Expected: build succeeds (this is the first task where the full build should succeed cleanly, since all `brand-*` references across the codebase were migrated in Tasks 2-5 and this task removes the last font-loading dependency). If the build fails, run:

Run: `grep -rn "brand-ink\|brand-accent" app components 2>&1` (Bash) or `Get-ChildItem -Recurse app,components -Include *.tsx,*.ts | Select-String "brand-ink|brand-accent"` (PowerShell)

to find any missed call site before proceeding — fix any found before moving to Task 7.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: remove Google Fonts, use Apple system font stack globally"
```

---

### Task 7: Redesign homepage sections with rainbow palette

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: all `rainbow-*` tint and solid color tokens from Task 1, `rainbow-gradient-border` utility class from Task 1.

- [ ] **Step 1: Add the cyclable rainbow color array and update `TRUST_SIGNALS`, `IDEOLOGICAL_AXES`, `FAQ_ITEMS` to reference it by index**

Replace lines 37-92 (the `TRUST_SIGNALS`, `IDEOLOGICAL_AXES`, `FAQ_ITEMS` constant declarations) with:

```typescript
const RAINBOW_ACCENTS = ['#F5C518', '#F5821F', '#E8385C', '#7B4FE0', '#1E9BE0', '#3CB043']

const TRUST_SIGNALS = [
  { title: 'Tamamen Anonim', description: 'Kimliğiniz veya iletişim bilgileriniz talep edilmez.', icon: '🕶️' },
  { title: 'Tarafsız Algoritma', description: 'Skorlama, herhangi bir partiye avantaj sağlamayan sabit kurallarla çalışır.', icon: '⚖️' },
  { title: 'Açık Kaynak', description: 'Eşleşme mantığı ve veri kullanımı şeffaf bir şekilde belgelenmiştir.', icon: '🔓' },
].map((signal, index) => ({ ...signal, accent: RAINBOW_ACCENTS[index % RAINBOW_ACCENTS.length] }))

const IDEOLOGICAL_AXES = [
  { name: 'Ekonomi: Piyasa vs Devlet', description: 'Ekonomik kararların piyasa mekanizmaları mı yoksa devlet müdahalesi mi ile yönetilmesi gerektiği', icon: '📈' },
  { name: 'Gelir Dağılımı', description: 'Gelir ve servetin dağılımı ile ilgili bakış açısı', icon: '⚖️' },
  { name: 'Sivil Özgürlükler', description: 'Bireysel özgürlüklerin devlet otoritesi ile dengesi', icon: '🕊️' },
  { name: 'Güvenlik ve Devlet', description: 'Milli güvenlik öncelikleri ve devletin rolü', icon: '🛡️' },
  { name: 'Sekülerizm', description: 'Din ve devlet ilişkisi', icon: '🏛️' },
  { name: 'Kimlik ve Göç', description: 'Ulusal kimlik ve göç politikaları', icon: '🌍' },
  { name: 'Dış Politika', description: 'Uluslararası ilişkiler ve dış politika yaklaşımı', icon: '🤝' },
  { name: 'AB İlişkileri', description: 'Avrupa Birliği ile ilişkiler ve uyum süreci', icon: '🇪🇺' },
  { name: 'Eğitim ve Sosyal Politika', description: 'Eğitim sistemi ve sosyal politikalar', icon: '🎓' },
  { name: 'Çevre ve Kalkınma', description: 'Çevre koruma ve ekonomik kalkınma dengesi', icon: '🌱' },
].map((axis, index) => ({ ...axis, accent: RAINBOW_ACCENTS[index % RAINBOW_ACCENTS.length] }))

const FAQ_ITEMS = [
  {
    question: 'oyvergitsin.org nedir?',
    answer:
      'oyvergitsin.org, Türkiye\'deki seçmenlerin siyasi görüşlerini kısa ve anonim bir anketle analiz ederek hangi siyasi partiye ne kadar yakın olduklarını gösteren tarafsız bir siyasi eşleşme platformudur.',
    icon: '❓',
  },
  {
    question: 'Anket ne kadar sürer?',
    answer:
      '10 ideolojik eksen üzerinden hazırlanmış kısa sorulardan oluşur ve birkaç dakika içinde tamamlanabilir.',
    icon: '⏱️',
  },
  {
    question: 'Verilerim anonim mi tutuluyor?',
    answer:
      'Evet. Anket tamamen anonimdir; ad, e-posta veya telefon gibi kimliğinizi ortaya çıkaracak herhangi bir bilgi talep edilmez.',
    icon: '🔒',
  },
  {
    question: 'Eşleşme sonucu nasıl hesaplanıyor?',
    answer:
      'Cevaplarınızdan her ideolojik eksen için bir puan hesaplanır ve bu puanlar Türkiye\'deki siyasi partilerin eksen pozisyonlarıyla karşılaştırılır. Sonuçta her parti için bir benzerlik yüzdesi elde edilir. Algoritma sabit kurallıdır ve herhangi bir partiye avantaj sağlamaz.',
    icon: '📊',
  },
  {
    question: 'Hangi partiler karşılaştırmaya dahil?',
    answer:
      'AKP, CHP, MHP, İYİ Parti, DEVA, Gelecek Partisi, Saadet Partisi, TİP, Vatan Partisi, Yeşil Sol Parti, Zafer Partisi ve Memleket Partisi dahil olmak üzere Türkiye\'deki başlıca partiler karşılaştırmaya dahildir.',
    icon: '🤝',
  },
].map((item, index) => ({ ...item, accent: RAINBOW_ACCENTS[index % RAINBOW_ACCENTS.length] }))
```

This preserves each item's original position/order (so `RAINBOW_ACCENTS[index % 6]` deterministically cycles yellow→orange→red→purple→blue→green→yellow...) while removing the old hardcoded per-item hex values.

- [ ] **Step 2: Update the hero section's glass card border to use the rainbow gradient**

Change line 127 from:

```typescript
          <div className="mx-auto max-w-2xl rounded-[1.75rem] border border-white/15 bg-white/10 p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl backdrop-saturate-150 md:p-14">
```

to:

```typescript
          <div className="rainbow-gradient-border mx-auto max-w-2xl rounded-[1.75rem] border-[3px] border-transparent bg-white/10 bg-origin-border p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl backdrop-saturate-150 md:p-14" style={{ backgroundClip: 'padding-box, border-box', backgroundImage: 'linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.1)), linear-gradient(90deg, #F5C518, #F5821F, #E8385C, #7B4FE0, #1E9BE0, #3CB043)' }}>
```

This uses the standard CSS technique for a gradient border on a semi-transparent background: two background layers via `background-clip` (`padding-box` for the fill, `border-box` for the gradient border), set inline since Tailwind's `bg-origin-border` utility alone can't express the double-gradient trick declaratively — the `rainbow-gradient-border` class is dropped from this element in favor of the explicit inline style. Remove `rainbow-gradient-border` from the className, keep the rest:

```typescript
          <div className="mx-auto max-w-2xl rounded-[1.75rem] border-[3px] border-transparent bg-white/10 bg-origin-border p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl backdrop-saturate-150 md:p-14" style={{ backgroundClip: 'padding-box, border-box', backgroundImage: 'linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.1)), linear-gradient(90deg, #F5C518, #F5821F, #E8385C, #7B4FE0, #1E9BE0, #3CB043)' }}>
```

Use this final version (without the `rainbow-gradient-border` class, since it's fully expressed via the inline `style`).

- [ ] **Step 3: Update the hero heading and body text colors (they used `text-brand-ink`)**

Check current hero heading — it already uses `text-brand-ink` per the original file read. Change line 128 from:

```typescript
            <h1 className="font-heading text-5xl font-semibold text-brand-ink md:text-6xl">
```

to:

```typescript
            <h1 className="font-heading text-5xl font-semibold text-ink-primary md:text-6xl">
```

Lines 131 and 134 use `text-brand-ink/80` and `text-brand-ink/65` — change to:

```typescript
            <p className="mt-6 text-xl text-ink-primary/80">
```

and:

```typescript
            <p className="mt-4 text-xl text-ink-primary/65">
```

- [ ] **Step 4: Change hero section wrapper — remove `bg-brand-ink`**

Change line 114 from:

```typescript
      <section className="relative overflow-hidden bg-brand-ink">
```

to:

```typescript
      <section className="relative overflow-hidden bg-ink-primary">
```

(The video covers this background during playback; it's a fallback color for load/no-motion states, so it stays a dark neutral rather than becoming a rainbow tint, consistent with the spec's hero treatment.)

- [ ] **Step 5: Update "Nasıl Çalışır" section background (yellow tint)**

Change line 147 from:

```typescript
      <section className="bg-surface py-20">
```

to:

```typescript
      <section className="bg-rainbow-yellow-tint py-20">
```

- [ ] **Step 6: Update Trust Signals section background (orange tint) and card accent usage**

Change line 166 from:

```typescript
      <section className="bg-surface-muted py-20">
```

to:

```typescript
      <section className="bg-rainbow-orange-tint py-20">
```

The `TRUST_SIGNALS.map` block (lines 169-193) already reads `signal.accent` via `style={{ borderTopColor: signal.accent, ... }}` and `style={{ backgroundColor: signal.accent }}` / `` `${signal.accent}1A` `` — no changes needed here since `signal.accent` now resolves from the new `RAINBOW_ACCENTS` cycle defined in Step 1. Leave lines 169-193 as-is.

- [ ] **Step 7: Update "10 İdeolojik Eksen" section background (purple tint)**

Change line 197 from:

```typescript
      <section className="bg-surface py-20">
```

to:

```typescript
      <section className="bg-rainbow-purple-tint py-20">
```

The `IDEOLOGICAL_AXES.map` block (lines 207-230) already reads `axis.accent` the same way — no changes needed, leave as-is.

- [ ] **Step 8: Update FAQ section background (green tint)**

Change line 237 from:

```typescript
      <section className="bg-surface-muted py-20">
```

to:

```typescript
      <section className="bg-rainbow-green-tint py-20">
```

The `FAQ_ITEMS.map` block (lines 243-267) already reads `item.accent` the same way — no changes needed, leave as-is.

- [ ] **Step 9: Update bottom CTA section (red tint, dark text instead of white)**

Change lines 271-282 from:

```typescript
      <section className="bg-brand-ink py-16">
        <Container className="text-center">
          <h2 className="font-heading text-2xl font-semibold text-white">
            Siyasi duruşunuzu birkaç dakikada keşfedin
          </h2>
          <div className="mt-8">
            <Link href="/consent">
              <Button variant="primary">Anketi Başlat</Button>
            </Link>
          </div>
        </Container>
      </section>
```

to:

```typescript
      <section className="bg-rainbow-red-tint py-16">
        <Container className="text-center">
          <h2 className="font-heading text-2xl font-semibold text-ink-primary">
            Siyasi duruşunuzu birkaç dakikada keşfedin
          </h2>
          <div className="mt-8">
            <Link href="/consent">
              <Button variant="primary">Anketi Başlat</Button>
            </Link>
          </div>
        </Container>
      </section>
```

- [ ] **Step 10: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: no new errors from `app/page.tsx`.

- [ ] **Step 11: Start dev server and visually verify the homepage**

Run: `npm run dev` (in background — use `run_in_background: true` or open a separate terminal)
Then navigate to `http://localhost:3000` in a browser and confirm:
- Header shows no logo image, just the "oyvergitsin.org" wordmark, with a thin rainbow gradient bar beneath it
- Hero section: video background plays (or dark fallback shows), glass card has a visible rainbow gradient border
- "Nasıl Çalışır" section has a pale yellow background
- Trust Signals section has a pale orange background, 3 cards show yellow/orange/red top borders in order
- "10 İdeolojik Eksen" section has a pale purple background, 10 cards cycle through all 6 accent colors twice (card 7 repeats yellow)
- "Son Haberler" section (if any news posts exist) has a pale blue background
- FAQ section has a pale green background, 5 cards cycle through 5 of the 6 accent colors
- Bottom CTA section has a pale red/pink background with dark (not white) heading text
- Footer is dark neutral (not navy), with a rainbow gradient bar at the top and blue-colored legal links
- All text uses a clean system sans-serif font (San Francisco on macOS, Segoe UI on Windows as the `system-ui` fallback) — no serif heading font anywhere

Stop the dev server after verification (`Ctrl+C` in that terminal, or use `TaskStop`/`TaskOutput` tooling if run via background task).

- [ ] **Step 12: Commit**

```bash
git add app/page.tsx
git commit -m "feat: redesign homepage sections with rainbow palette"
```

---

### Task 8: Final sitewide verification — confirm zero remaining brand-* references and clean build

**Files:**
- None modified (verification-only task). May touch any file if Step 1 finds a missed reference.

**Interfaces:**
- None — this task consumes the completed state of Tasks 1-7 and validates it.

- [ ] **Step 1: Grep for any remaining `brand-ink`/`brand-accent` references across the whole repo**

Run: `grep -rn "brand-ink\|brand-accent" app components lib 2>&1` (Bash)
or: `Get-ChildItem -Recurse app,components,lib -Include *.tsx,*.ts | Select-String "brand-ink|brand-accent"` (PowerShell)

Expected: no matches. If any are found, apply the same token mapping from the Global Constraints section (`brand-accent*` → `rainbow-blue`/`rainbow-blue-hover`, `brand-ink` → `ink-primary`) to that file, then re-run this grep until it returns empty.

- [ ] **Step 2: Confirm `tailwind.config.ts` no longer exports `brand` colors**

Run: `grep -n "brand" tailwind.config.ts 2>&1` (Bash) or `Select-String "brand" tailwind.config.ts` (PowerShell)
Expected: no matches (the `colors.rainbow` block from Task 1 does not contain the substring `brand`).

- [ ] **Step 3: Run full typecheck and production build**

Run: `npx tsc --noEmit`
Expected: no errors (or only pre-existing errors unrelated to this change — compare against a baseline if unsure).

Run: `npm run build`
Expected: build completes successfully with no errors.

- [ ] **Step 4: Spot-check three non-homepage pages visually**

Run: `npm run dev` (background)
Navigate to:
- `http://localhost:3000/survey` (or `/consent` first if survey requires consent to start) — confirm the selected-answer border shows `rainbow-blue`, not the old red/navy.
- `http://localhost:3000/legal/privacy-policy` — confirm the "Ana sayfaya dön" link and in-page links are `rainbow-blue`.
- `http://localhost:3000/admin/login` — confirm the nav (if visible) and input focus-border use the new tokens, and no console errors appear.

Stop the dev server after verification.

- [ ] **Step 5: Commit final state (only if Step 1 required fixes; otherwise skip — no changes to commit)**

```bash
git add -A
git commit -m "fix: migrate remaining brand-* references found in final sweep"
```

If Step 1 found zero matches, there is nothing to commit for this task — the plan is complete as of Task 7's commit.

---

## Self-Review Notes

- **Spec coverage:** Color Palette (Task 1), Section Color Mapping (Task 7), Header (Task 3), Footer (Task 3), Typography (Tasks 1 + 6), Logo Assets (Task 3 — logo removed from Header only, video poster untouched as specified), Sitewide Token Migration (Tasks 2, 4, 5), Sitewide Font Migration (Task 6), Testing/Verification (Task 8) — all spec sections have a corresponding task.
- **Placeholder scan:** No TBD/TODO markers; every step shows exact code or exact grep/build commands with expected output.
- **Type consistency:** `RAINBOW_ACCENTS` array and `.map(..., accent: ...)` pattern in Task 7 Step 1 is consumed unchanged by the existing JSX in `app/page.tsx` (which already destructures `.accent` per item) — verified against the original file read, no rename needed.
