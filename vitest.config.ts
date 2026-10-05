import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Saf skorlama çekirdeği ve küçük güvenlik/guard helper'ları test edilir; bu
// modüller Supabase'e ve Next.js runtime'ına dokunmaz.
export default defineConfig({
  plugins: [tsconfigPaths()],
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    include: [
      'lib/**/*.test.ts',
      'lib/**/*.test.tsx',
      'scripts/**/*.test.ts',
      // components/siyaset-radari/party-colors.test.ts (B13) burada kosmuyordu:
      // parti rengi eslemesinin (tarafsizlik) testi sessizce atlaniyordu.
      // Yalnizca saf .ts yardimcilar; React bilesen testi degil.
      'components/**/*.test.ts',
    ],
  },
})
