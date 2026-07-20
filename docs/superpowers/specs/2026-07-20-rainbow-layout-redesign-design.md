# Rainbow Layout Redesign — Design Spec

Date: 2026-07-20

## Purpose

Replace oyvergitsin.org's current navy/red/gold brand identity with a playful 6-color rainbow palette (yellow, orange, red/pink, purple, blue, green) from the user's reference image, remove the logo image, and switch typography to an Apple system-font stack.

## Scope

Initial investigation found `brand-ink` / `brand-accent` Tailwind tokens used well beyond the homepage: shared UI primitives (`Button`, `ProgressBar`), admin (`AdminNav`, `FormField`, admin login), legal pages, and the survey page. Removing these tokens without updating all call sites would break those pages visually. The user confirmed: **migrate the entire site to the rainbow palette**, not just the homepage. This spec therefore covers every file referencing `brand-ink` / `brand-accent` / the old Google Fonts, in addition to the homepage section redesign.

## Color Palette

Six base rainbow colors, added to `tailwind.config.ts` as `theme.extend.colors.rainbow`:

| Name    | Hex       |
|---------|-----------|
| yellow  | `#F5C518` |
| orange  | `#F5821F` |
| red     | `#E8385C` |
| purple  | `#7B4FE0` |
| blue    | `#1E9BE0` |
| green   | `#3CB043` |

Each color also gets a pastel/tint variant for section backgrounds (approx. 8-10% mix into white), added as `rainbow-{name}-tint`, e.g. `rainbow-yellow-tint: '#FDF6DC'`. Exact tint values computed during implementation to keep consistent lightness (~L 95%) across all six.

The old `brand.ink` (#1B2A4A) and `brand.accent` (#C1272D / #A31F24) tokens are removed from Tailwind config and replaced everywhere they're referenced.

## Section Color Mapping (homepage, top to bottom)

1. **Hero** — background video (`hero-bg.mp4`) is kept as-is. No pastel section background (would fight the video). The glass card overlay keeps a neutral frosted look, but gets a 3px rainbow gradient border (linear-gradient across all 6 colors) instead of the current plain white border, as the section's identity marker.
2. **Nasıl Çalışır (How it works)** — `rainbow-yellow-tint` background.
3. **Trust Signals** — `rainbow-orange-tint` background. The 3 cards cycle accent colors yellow → orange → red (first 3 of the 6-color cycle, since there are only 3 cards).
4. **10 İdeolojik Eksen** — `rainbow-purple-tint` background. The 10 cards cycle through all 6 accent colors in order, wrapping (card 7 repeats yellow, etc.).
5. **LatestNews** — `rainbow-blue-tint` background (currently no explicit background; will add one at the section wrapper level inside the component or via a wrapping section in `page.tsx` — implementer decides based on component structure).
6. **FAQ** — `rainbow-green-tint` background. The 5 FAQ cards cycle through all 6 accent colors in order.
7. **Bottom CTA** — `rainbow-red-tint` background, replacing the current `bg-brand-ink` (dark navy). Text switches from white to dark ink color for contrast on the light pastel background.

Card accent colors (currently inline `style={{ borderTopColor: ... }}` hex values per item) are reassigned by cycling `RAINBOW_COLORS = [yellow, orange, red, purple, blue, green]` using the item's index modulo 6, replacing the hardcoded per-item hex values in the `TRUST_SIGNALS`, `IDEOLOGICAL_AXES`, and `FAQ_ITEMS` arrays in `app/page.tsx`.

## Header

- Remove the `<Image src="/logo.png" .../>` element entirely from `components/layout/Header.tsx`.
- Keep the `oyvergitsin.org` wordmark as plain text (already exists as `siteConfig.shortName`), styled with the new Apple font stack, semibold, using `ink.primary` color (no longer `brand.ink`).
- Add a 3px bottom border on the header using a rainbow linear-gradient (replacing the current `border-brand-accent/30` solid border) as the site's primary brand marker in place of the logo.

## Footer

- Replace `bg-brand-ink` with a neutral dark background (`ink.primary`, `#1A1D23` — already defined in Tailwind config, no new token needed).
- Replace `border-brand-accent/30` top border with the same rainbow gradient treatment used in the header, for visual consistency.
- Replace `text-brand-accent` / `hover:text-brand-accent-hover` link colors (legal links, external link) with one rainbow color (blue, for consistency with typical link affordance) — `rainbow-blue` / a slightly lighter hover shade.
- No content or structural changes to footer links.

## Typography

- Remove `next/font/google` imports (`Inter`, `Source_Serif_4`) from `app/layout.tsx`.
- Replace both `--font-body` and `--font-heading` CSS variables with an Apple system font stack: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif`.
- Headings keep a distinct weight (semibold/bold) from body text via Tailwind `font-semibold`/`font-bold` utility classes already in use — no separate serif heading font anymore, both use the same Apple stack at different weights.
- `tailwind.config.ts` `fontFamily.heading` and `fontFamily.body` both point to the new CSS variable (or directly to the system stack, since there's no external font loading needed).

## Logo Assets

- `public/logo.png` (or wherever it's referenced) is no longer used in `Header.tsx`. It's not deleted from disk in this change (may be referenced elsewhere — e.g., favicon, hero video poster, manifest, opengraph image) — only the header usage is removed. A follow-up cleanup task can audit remaining references separately.
- The hero `<video poster="/logo.png">` reference is left untouched since the task only says "remove the logo," understood in context as removing it from the header/branding position, not from the video poster fallback image.

## Sitewide Token Migration

`brand.ink` and `brand.accent` (+ `accent-hover`) are removed entirely from `tailwind.config.ts` once every usage below is migrated. Mapping:

- `bg-brand-accent` / `text-brand-accent` / `border-brand-accent` (primary interactive color — buttons, links, focus rings, active states) → `rainbow-blue` (chosen as the single sitewide "primary accent" since these usages need one consistent color, not a per-section rainbow cycle).
- `hover:bg-brand-accent-hover` / `hover:text-brand-accent-hover` → a darker shade of `rainbow-blue` (new token `rainbow-blue-hover`, same darkening ratio as the old `accent` → `accent-hover` step).
- `bg-brand-ink` / `text-brand-ink` (solid dark navy backgrounds/text — footer, admin nav, hero heading text) → `ink-primary` (`#1A1D23`, already defined in Tailwind config as the dark neutral token).

Affected files and their specific changes:

- `components/ui/Button.tsx:11` — primary variant classes `bg-brand-accent text-brand-ink hover:bg-brand-accent-hover` → `bg-rainbow-blue text-white hover:bg-rainbow-blue-hover`.
- `components/ui/ProgressBar.tsx:11` — `bg-brand-accent` → `bg-rainbow-blue`.
- `components/admin/AdminNav.tsx:32` — `bg-brand-ink` → `bg-ink-primary`.
- `components/admin/FormField.tsx:25` — `focus:border-brand-accent` → `focus:border-rainbow-blue`.
- `app/admin/login/page.tsx:70,84` — same focus-border swap as FormField.
- `app/survey/page.tsx:180` — `border-brand-accent` (selected-option state) → `border-rainbow-blue`.
- `app/legal/layout.tsx:24`, `app/legal/cookie-policy/page.tsx:60`, `app/legal/privacy-policy/page.tsx:67,95`, `app/legal/kvkk-disclosure/page.tsx:32,108`, `app/legal/terms-of-use/page.tsx:87` — all `text-brand-accent underline ... hover:text-brand-accent-hover` link styles → `text-rainbow-blue ... hover:text-rainbow-blue-hover`.
- `components/home/LatestNews.tsx:74` — `hover:text-brand-accent` → `hover:text-rainbow-blue`.

All of the above are one-token-for-another swaps with no structural/layout changes — low risk, mechanical.

## Sitewide Font Migration

The Apple system-font stack (see Typography section) applies globally via the `--font-heading` / `--font-body` CSS variables set in `app/layout.tsx`, so every page — admin, legal, survey — automatically inherits the new font once `app/layout.tsx` and `tailwind.config.ts` are updated. No per-page font changes needed beyond the root layout, since `font-heading`/`font-body` Tailwind utility classes are reused as-is across the codebase (e.g. `AdminNav.tsx:37`, `LatestNews.tsx:64`) and simply resolve to the new stack.

## Out of Scope

- Survey question content, admin functionality/logic, legal page text content — no content or behavior changes, styling only.
- Results pages (`app/results/**`) — not found to reference `brand-*` tokens in the initial grep; if implementation finds any, apply the same token mapping above.
- Favicon, manifest icons, opengraph image — unchanged.
- No new sections, no new features — purely a re-skin of existing structure and a mechanical token migration.

## Testing / Verification

- Visual check via dev server (`npm run dev`): homepage (each section's pastel background, cycling card accents, header/footer gradient border), plus a spot-check of survey page, admin login, and one legal page to confirm buttons/links/focus states render correctly with the new blue accent and dark-neutral backgrounds.
- Run `npx tsc --noEmit` (or existing typecheck script) to confirm no type errors from removed imports/tokens.
- Final grep for `brand-ink`, `brand-accent`, `brand-accent-hover` across the whole repo (`app/`, `components/`) to confirm zero remaining references before considering the migration complete.
