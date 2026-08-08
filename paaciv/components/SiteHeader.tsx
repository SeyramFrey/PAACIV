import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Container } from '@/components/ui/Container'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const navItems = [
  { href: '/carte', key: 'carte' },
  { href: '/archives', key: 'archives' },
  { href: '/actualites', key: 'actualites' },
  { href: '/architectes', key: 'architectes' },
  { href: '/a-propos', key: 'apropos' },
  { href: '/contact', key: 'contact' },
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
            {navItems.map((item) => (
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

          <LanguageSwitcher />
        </div>
      </Container>
    </header>
  )
}
