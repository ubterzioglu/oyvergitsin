import { defineConfig, devices } from '@playwright/test'

// E2E testleri yerel dev sunucusuna karşı koşar ve gerçek veritabanını kullanır
// (oturum ve cevap yazar). Skorlama matematiği birim testlerde kapsandığı için
// buradaki testler yalnızca tarayıcıda ortaya çıkan davranışları hedefler.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    locale: 'tr-TR',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000/api/health',
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
