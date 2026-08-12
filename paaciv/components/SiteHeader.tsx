import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Container } from '@/components/ui/Container'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { BasculeTheme } from '@/components/ui/BasculeTheme'

// Éléments de navigation avant le regroupement « Actualités » (position
// historique du lien mort /actualites, conservée pour l'ordre visuel).
const navItemsAvant = [
  { href: '/carte', key: 'carte' },
  { href: '/archives', key: 'archives' },
] as const

const navItemsApres = [
  { href: '/architectes', key: 'architectes' },
  { href: '/a-propos', key: 'apropos' },
  { href: '/contact', key: 'contact' },
] as const

// « Actualités » n'est pas une page — c'est un regroupement visuel au-dessus
// de trois index distincts. Rendu en sous-liste toujours visible (pas de
// <details>/JS) pour rester utilisable au clavier et sans JavaScript.
const actualitesLinks = [
  { href: '/articles', key: 'articles' },
  { href: '/reportages', key: 'reportages' },
  { href: '/evenements', key: 'evenements' },
] as const

export function SiteHeader() {
  const t = useTranslations('nav')

  return (
    <header className="border-b border-creme2 bg-sable">
      <Container className="flex flex-wrap items-center justify-between gap-4 py-4">
        <Link
          href="/"
          className="font-serif text-xl font-semibold tracking-wide text-brun"
        >
          PAACIV
        </Link>

        <nav aria-label={t('principale')}>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-encre">
            {navItemsAvant.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="transition hover:text-brun">
                  {t(item.key)}
                </Link>
              </li>
            ))}
            <li>
              <span id="nav-actualites-label" className="text-encre/60">
                {t('actualites')}
              </span>
              <ul
                aria-labelledby="nav-actualites-label"
                className="ml-2 inline-flex items-center gap-x-3"
              >
                {actualitesLinks.map((item) => (
                  <li key={item.key} className="inline">
                    <Link href={item.href} className="transition hover:text-brun">
                      {t(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            {navItemsApres.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="transition hover:text-brun">
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t('recherche')}
            className="rounded-full p-2 text-brun transition hover:bg-creme2"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          <BasculeTheme className="rounded-full p-2 text-brun transition hover:bg-creme2" />

          <LanguageSwitcher />
        </div>
      </Container>
    </header>
  )
}
