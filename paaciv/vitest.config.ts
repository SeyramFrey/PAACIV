import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Le dossier tests/ contient les specs Playwright (npm run e2e) : on les
    // exclut pour éviter que Vitest ne tente de les exécuter lui-même.
    exclude: ['**/node_modules/**', 'tests/**'],
  },
})
