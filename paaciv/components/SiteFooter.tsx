import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Container } from '@/components/ui/Container'

const explorerLinks = [
  { href: '/carte', key: 'carte' },
  { href: '/archives', key: 'archives' },
  { href: '/architectes', key: 'architectes' },
  { href: '/articles', key: 'articles' },
  { href: '/reportages', key: 'reportages' },
  { href: '/evenements', key: 'evenements' },
] as const

const infosLinks = [
  { href: '/a-propos', key: 'apropos' },
  { href: '/contact', key: 'contact' },
] as const

export function SiteFooter() {
  const t = useTranslations('nav')
  const tf = useTranslations('footer')

  return (
    <footer className="border-t border-creme2 bg-creme2/60">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-serif text-lg font-semibold text-brun">PAACIV</p>
          <p className="mt-3 text-sm text-encre/80">{tf('description')}</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brun">
            {tf('explorer')}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-encre/80">
            {explorerLinks.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="transition hover:text-brun">
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brun">
            {tf('infos')}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-encre/80">
            {infosLinks.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="transition hover:text-brun">
                  {t(item.key)}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/conditions-utilisation"
                className="transition hover:text-brun"
              >
                {tf('conditions')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brun">
            {tf('suivezNous')}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-encre/80">
            <li>
              <a
                href="https://www.instagram.com/paaciv"
                target="_blank"
                rel="noreferrer noopener"
                className="transition hover:text-brun"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href="https://www.linkedin.com/company/paaciv"
                target="_blank"
                rel="noreferrer noopener"
                className="transition hover:text-brun"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href="mailto:contact@paaciv.com"
                aria-label={t('contact')}
                className="transition hover:text-brun"
              >
                contact@paaciv.com
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-creme2 py-4 text-center text-xs text-encre/60">
        © {new Date().getFullYear()} PAACIV. {tf('droits')}
      </div>
    </footer>
  )
}
