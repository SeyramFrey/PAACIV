import { defineConfig } from '@playwright/test'
import { loadEnvConfig } from '@next/env'

// Charge `.env.local` (mêmes conventions que Next.js) pour que les tests
// d'intégration BDD disposent de NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY.
loadEnvConfig(process.cwd())

export default defineConfig({
  testDir: './tests',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: { baseURL: 'http://localhost:3000' },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'e2e',
      dependencies: ['setup'],
      use: { baseURL: 'http://localhost:3000' },
      testIgnore: /auth\.setup\.ts/,
    },
  ],
})
