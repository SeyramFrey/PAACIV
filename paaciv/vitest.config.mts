import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
      // Next 16 ne publie plus de champ "exports" pour ses sous-chemins :
      // la résolution ESM stricte de Vite/Vitest échoue sur `next/navigation`
      // (utilisé par next-intl) faute d'extension explicite. On force le
      // fichier réel pour que les composants utilisant `@/i18n/navigation`
      // (Link, etc.) soient testables.
      'next/navigation': path.resolve(import.meta.dirname, 'node_modules/next/navigation.js'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // `next-intl` importe `next/navigation` sans extension ; comme le
    // paquet `next` n'expose plus de champ "exports", la résolution ESM
    // native (hors pipeline Vite) échoue. On force l'inlining pour que le
    // resolve.alias ci-dessus s'applique.
    server: {
      deps: {
        inline: [/next-intl/, /^next$/],
      },
    },
    // Le dossier tests/ contient les specs Playwright (npm run e2e) : on les
    // exclut pour éviter que Vitest ne tente de les exécuter lui-même.
    exclude: ['**/node_modules/**', 'tests/**'],
  },
})
