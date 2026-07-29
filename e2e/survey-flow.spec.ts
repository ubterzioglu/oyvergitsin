import { expect, test } from '@playwright/test'

/**
 * Anketin gerçek tarayıcıdaki davranışını doğrular.
 *
 * Birim testler skorlama matematiğini, smoke script API zincirini kapsıyor.
 * Buradaki testler yalnızca tarayıcıda ortaya çıkan davranışları hedefler:
 * otomatik ilerleme, önem işaretiyle etkileşimi ve "Fikrim yok"un ölçekten
 * ayrı bir kontrol olması.
 */

const LIKERT_LABELS = [
  'Kesinlikle katılmıyorum',
  'Katılmıyorum',
  'Kararsızım',
  'Katılıyorum',
  'Kesinlikle katılıyorum',
]

async function startSurvey(page: import('@playwright/test').Page) {
  await page.goto('/consent')
  await page.getByRole('button', { name: 'Kabul Et ve Devam Et' }).click()
  await page.waitForURL('**/survey')
  await expect(page.getByText('Soru 1 /')).toBeVisible()
}

test.describe('anket ekranı', () => {
  test('25 madde gösterilir ve ilk madde 5 basamaklı Likert ölçeğidir', async ({ page }) => {
    await startSurvey(page)

    await expect(page.getByText('Soru 1 / 25')).toBeVisible()

    for (const label of LIKERT_LABELS) {
      await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible()
    }
  })

  test('"Fikrim yok" ölçeğin bir basamağı değil, ayrı bir kontroldür', async ({ page }) => {
    await startSurvey(page)

    const noOpinion = page.getByRole('button', { name: 'Fikrim yok', exact: true })
    await expect(noOpinion).toBeVisible()
    await expect(noOpinion).toHaveAttribute('aria-pressed', 'false')

    // Ölçek butonları aria-pressed taşır; "Fikrim yok" da öyle ama ölçek
    // kutularının dışında durur. Kararsızım ile aynı satırda olmamalı.
    const neutral = page.getByRole('button', { name: 'Kararsızım', exact: true })
    const neutralBox = await neutral.boundingBox()
    const noOpinionBox = await noOpinion.boundingBox()

    expect(neutralBox).not.toBeNull()
    expect(noOpinionBox).not.toBeNull()
    expect(noOpinionBox!.y).toBeGreaterThan(neutralBox!.y + neutralBox!.height - 1)
  })

  test('şık seçilince otomatik olarak sonraki maddeye geçilir', async ({ page }) => {
    await startSurvey(page)

    await page.getByRole('button', { name: 'Katılıyorum', exact: true }).click()

    await expect(page.getByText('Soru 2 / 25')).toBeVisible({ timeout: 3000 })
  })

  test('önem işareti otomatik ilerlemeyi iptal eder', async ({ page }) => {
    await startSurvey(page)

    // Şık seçilir; otomatik ilerleme zamanlanır.
    await page.getByRole('button', { name: 'Katılıyorum', exact: true }).click()
    // Kullanıcı hemen önem işaretine basar.
    await page.getByRole('switch', { name: /önemli/i }).click()

    // Zamanlanmış geçiş iptal edilmiş olmalı: aynı maddede kalınır.
    await page.waitForTimeout(1200)
    await expect(page.getByText('Soru 1 / 25')).toBeVisible()
    await expect(page.getByRole('switch', { name: /önemli/i })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })

  test('"Fikrim yok" seçilebilir ve seçili görünür', async ({ page }) => {
    await startSurvey(page)

    const noOpinion = page.getByRole('button', { name: 'Fikrim yok', exact: true })
    await noOpinion.click()

    await expect(page.getByText('Soru 2 / 25')).toBeVisible({ timeout: 3000 })

    // Geri dönünce seçim korunmalı.
    await page.getByRole('button', { name: 'Önceki' }).click()
    await expect(
      page.getByRole('button', { name: 'Fikrim yok', exact: true })
    ).toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('uçtan uca akış', () => {
  test('anket doldurulup sonuç ekranına ulaşılır', async ({ page }) => {
    test.slow()
    await startSurvey(page)

    for (let index = 0; index < 25; index += 1) {
      const isLast = index === 24

      // İlk maddede "Fikrim yok", ikincide önem işareti denenir; kalanında
      // tutarlı bir cevap verilir.
      if (index === 0) {
        await page.getByRole('button', { name: 'Fikrim yok', exact: true }).click()
      } else {
        await page.getByRole('button', { name: 'Katılıyorum', exact: true }).click()
        if (index === 1) {
          await page.getByRole('switch', { name: /önemli/i }).click()
        }
      }

      if (isLast) {
        await page.getByRole('button', { name: 'Sonuçları Gör' }).click()
      } else if (index === 1) {
        // Önem işareti otomatik ilerlemeyi iptal ettiği için elle ilerlenir.
        await page.getByRole('button', { name: 'Sonraki' }).click()
      }

      if (!isLast) {
        await expect(page.getByText(`Soru ${index + 2} / 25`)).toBeVisible({ timeout: 5000 })
      }
    }

    await page.waitForURL('**/results/**', { timeout: 30000 })

    await expect(page.getByRole('heading', { name: 'Sonuçlarınız' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'En Yüksek Örtüşme' })).toBeVisible()
    await expect(page.getByText('politika görüşü benzerliği')).toBeVisible()

    // Kapsama etiketi: "Fikrim yok" verilen eksen "orta" göstermeli.
    await expect(page.getByText('orta', { exact: true }).first()).toBeVisible()

    // "Neden bu sonuç" kartı dolu gelmeli.
    await expect(page.getByRole('heading', { name: 'Neden bu sonuç?' })).toBeVisible()
    await expect(page.getByText('En çok örtüşen konular')).toBeVisible()

    // Konumlandırılmamış partiler ayrı listelenmeli, sıfır puan almamalı.
    await expect(page.getByText('Konumlandırılmamış partiler')).toBeVisible()
  })
})
