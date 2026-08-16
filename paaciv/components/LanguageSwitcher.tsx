'use client'

import { useLocale } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

const labels: Record<(typeof routing.locales)[number], string> = {
  fr: 'FR',
  en: 'EN',
}

export function LanguageSwitcher() {
  const pathname = usePathname()
  const activeLocale = useLocale()

  // Couleurs héritées (`currentColor` / `var(--accent)`) plutôt que les
  // teintes Tailwind d'origine (`bg-or`, `text-brun`…) : ce composant est
  // désormais posé sur trois fonds différents (en-tête, pied de page sombre,
  // panneau du menu mobile) via la Task 9, et une couleur fixe y devenait
  // illisible ou — pour `bg-or` — faisait réapparaître la teinte dorée que
  // la charte bannit. `var(--accent)` est déjà le token utilisé pour tous
  // les boutons d'action du site (voir SiteHeader, MenuMobile).
  return (
    <div role="group" aria-label="Changer de langue" className="flex items-center gap-1 text-sm font-semibold">
      {routing.locales.map((locale) => {
        const actif = locale === activeLocale
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            aria-current={actif ? 'true' : undefined}
            className="rounded-full px-3 py-1 transition hover:opacity-70"
            style={
              actif
                ? { background: 'var(--accent)', color: 'oklch(0.15 0.012 45)' }
                : { color: 'inherit' }
            }
          >
            {labels[locale]}
          </Link>
        )
      })}
    </div>
  )
}
