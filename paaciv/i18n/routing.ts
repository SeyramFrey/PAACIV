import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  // La racine "/" doit toujours rediriger vers la locale par défaut (/fr),
  // indépendamment de l'en-tête Accept-Language du navigateur.
  localeDetection: false,
})
