import { defineConfig } from '@playwright/test'
import { loadEnvConfig } from '@next/env'

// Charge `.env.local` (mêmes conventions que Next.js) pour que les tests
// d'intégration BDD disposent de NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY.
loadEnvConfig(process.cwd())

export default defineConfig({
  testDir: './tests',
  // Les tests écrivent dans les tables de collecte de PRODUCTION ; le couple
  // setup/teardown borne l'exécution dans le temps puis supprime les seules
  // lignes qu'elle a insérées. Voir `tests/global-teardown.ts`.
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
  // `next dev` sous la parallélisation par défaut de Playwright déclenche des
  // 500/erreurs JSON intermittentes (recompilations concurrentes). On pince
  // le nombre de workers pour une suite fiable en une seule passe.
  workers: 2,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3100',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: { baseURL: 'http://localhost:3100' },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'e2e',
      dependencies: ['setup'],
      use: { baseURL: 'http://localhost:3100' },
      testIgnore: /auth\.setup\.ts/,
    },
  ],
})
