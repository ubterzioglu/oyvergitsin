import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Yalnızca saf skorlama çekirdeği test edilir; bu modüller Supabase'e ve
// Next.js runtime'ına dokunmaz, bu yüzden ek ortam kurulumuna gerek yoktur.
export default defineConfig({
  plugins: [tsconfigPaths()],
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'lib/**/*.test.tsx'],
  },
})
