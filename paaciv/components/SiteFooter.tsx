import { getTranslations, getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { chargerTextes, texte } from '@/lib/data/contenu-site'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const ENTREES = [
  { href: '/carte', cle: 'carte' },
  { href: '/archives', cle: 'archives' },
  { href: '/architectes', cle: 'architectes' },
  { href: '/articles', cle: 'articles' },
  { href: '/reportages', cle: 'reportages' },
  { href: '/evenements', cle: 'evenements' },
] as const

const RESEAUX = [
  { libelle: 'Instagram', href: 'https://www.instagram.com/paaciv' },
  { libelle: 'LinkedIn', href: 'https://www.linkedin.com/company/paaciv' },
] as const

export async function SiteFooter() {
  const t = await getTranslations('nav')
  const tf = await getTranslations('footer')
  const locale = await getLocale()
  const textes = await chargerTextes()

  const email = texte(textes, 'footer_email', locale)

  return (
    <footer
      id="contact"
      className="px-5 pb-10 pt-16 sm:px-8 lg:px-14 lg:pt-24"
      style={{ background: 'var(--deep)', color: 'var(--onDeep)' }}
    >
      <div className="mx-auto grid max-w-7xl gap-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-serif text-2xl">PAACIV</p>
          <p className="mt-4 text-sm opacity-70">{texte(textes, 'footer_description', locale)}</p>
        </div>

        <div>
          <h2 className="text-[10px] uppercase tracking-[0.24em] opacity-60">{tf('naviguer')}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {ENTREES.map((e) => (
              <li key={e.cle}>
                <Link href={e.href} className="transition hover:text-[var(--accent)]" style={{ color: 'inherit' }}>
                  {t(e.cle)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[10px] uppercase tracking-[0.24em] opacity-60">{tf('joindre')}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="opacity-80">{texte(textes, 'footer_adresse', locale)}</li>
            <li>
              {/* Un e-mail non renseigné ne doit pas produire un `mailto:` vide
                  et cliquable : on rend alors le texte brut. */}
              {email.startsWith('À COMPLÉTER') ? (
                <span className="opacity-80">{email}</span>
              ) : (
                <a href={`mailto:${email}`} className="transition hover:text-[var(--accent)]" style={{ color: 'inherit' }}>
                  {email}
                </a>
              )}
            </li>
            <li className="opacity-80">{texte(textes, 'footer_telephone', locale)}</li>
          </ul>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.24em] opacity-60">{tf('suivre')}</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {RESEAUX.map((r) => (
                <li key={r.libelle}>
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="transition hover:text-[var(--accent)]"
                    style={{ color: 'inherit' }}
                  >
                    {r.libelle}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.24em] opacity-60">{tf('langue')}</h2>
            <div className="mt-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      <div
        className="mx-auto mt-16 flex max-w-7xl flex-wrap justify-between gap-3 border-t pt-6 text-xs opacity-60"
        style={{ borderColor: 'color-mix(in oklab, var(--onDeep) 20%, transparent)' }}
      >
        <span>© {new Date().getFullYear()} PAACIV — {tf('droits')}</span>
        <span>{tf('credits')}</span>
      </div>
    </footer>
  )
}
