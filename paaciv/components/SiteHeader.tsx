'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { BasculeTheme } from '@/components/ui/BasculeTheme'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { MenuMobile, type Entree } from '@/components/MenuMobile'
import { useSoutien } from '@/components/soutenir/ContexteSoutien'

// Six entrées, une par rubrique du site. Les ancres du design (#archive,
// #journal…) sont remplacées par les vraies routes : le header est partagé
// par toutes les pages, où ces ancres ne mèneraient nulle part.
const ENTREES: readonly Entree[] = [
  { href: '/carte', cle: 'carte' },
  { href: '/archives', cle: 'archives' },
  { href: '/architectes', cle: 'architectes' },
  { href: '/articles', cle: 'articles' },
  { href: '/reportages', cle: 'reportages' },
  { href: '/evenements', cle: 'evenements' },
] as const

export function SiteHeader() {
  const t = useTranslations('nav')
  const { ouvrir } = useSoutien()
  const [opaque, setOpaque] = useState(false)

  // Le header devient opaque une fois le hero dépassé (85 % de la hauteur
  // d'écran, comme la référence ligne 700+). Sur les pages sans hero, la
  // valeur est franchie presque immédiatement, ce qui est le comportement
  // voulu : fond lisible dès le premier défilement.
  useEffect(() => {
    function auScroll() {
      setOpaque(window.scrollY > window.innerHeight * 0.85)
    }
    window.addEventListener('scroll', auScroll, { passive: true })
    auScroll()
    return () => window.removeEventListener('scroll', auScroll)
  }, [])

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-6 px-5 py-4 backdrop-blur-[14px] transition-[background-color] duration-500 sm:px-8 lg:px-14"
      style={{
        background: opaque ? 'color-mix(in oklab, var(--bg) 82%, transparent)' : 'transparent',
        color: opaque ? 'var(--ink)' : 'var(--onDeep)',
      }}
    >
      <Link href="/" className="flex items-center gap-3" style={{ color: 'inherit' }}>
        <span
          aria-hidden="true"
          className="grid h-9 w-9 place-items-center border text-[15px]"
          style={{ borderColor: 'currentColor', fontFamily: 'var(--font-fraunces), serif' }}
        >
          P
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-wide">PAACIV</span>
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-70">
            Patrimoine · Côte d&apos;Ivoire
          </span>
        </span>
      </Link>

      <nav aria-label={t('principale')} className="hidden lg:block">
        <ul className="flex items-center gap-7 text-sm">
          {ENTREES.map((e) => (
            <li key={e.cle}>
              <Link href={e.href} className="transition hover:text-[var(--accent)]" style={{ color: 'inherit' }}>
                {t(e.cle)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex lg:items-center lg:gap-3">
          <LanguageSwitcher />
          <BasculeTheme className="rounded-full border p-2 transition hover:bg-[var(--accent)] hover:text-[oklch(0.15_0.012_45)]" />
          <button
            type="button"
            onClick={() => ouvrir('adhesion')}
            className="rounded-full px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
            style={{ background: 'var(--accent)', color: 'oklch(0.15 0.012 45)' }}
          >
            {t('adherer')}
          </button>
        </div>
        <MenuMobile entrees={ENTREES} />
      </div>
    </header>
  )
}
