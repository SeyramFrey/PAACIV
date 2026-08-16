'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
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
  const pathname = usePathname()
  // Seul l'accueil aura un hero sombre plein écran (Task 10) : c'est la
  // seule page où l'en-tête peut partir transparent. Partout ailleurs
  // (carte, fiches, login, admin…), il n'y a pas de hero sous lequel se
  // fondre — un en-tête transparent y écrirait du texte clair sur un fond
  // clair (ou l'inverse), illisible en permanence puisque le seuil de
  // défilement ci-dessous n'est jamais atteint sur une page courte.
  const estAccueil = pathname === '/'
  const header = useRef<HTMLElement>(null)
  // État sûr par défaut : OPAQUE. Un en-tête transparent qui écrirait
  // `--onDeep` sur un fond clair (identiques en thème clair, dette de la
  // Task 9) est le pire des deux erreurs possibles ; un en-tête opaque un
  // instant de trop au-dessus du hero n'est qu'un flash cosmétique. Cet état
  // est donc celui du rendu serveur (pas de JS → jamais transparent), et
  // celui qui tient tant que l'effet ci-dessous n'a pas positivement
  // confirmé que le hero est encore derrière l'en-tête.
  const [opaqueDefilement, setOpaqueDefilement] = useState(true)

  // Sur l'accueil, le header redevient transparent tant que le hero est
  // visuellement derrière lui, puis repasse opaque une fois le hero
  // dépassé. Le seuil est dérivé du bas RÉEL du hero (`#top`), pas d'un
  // pourcentage de `innerHeight` : le hero fait `min-h-[100svh]`, et
  // `100svh` est par définition inférieur à `window.innerHeight` dès que la
  // barre d'URL mobile se masque — un seuil en pourcentage de `innerHeight`
  // ne se déclencherait alors jamais avant que le hero ne soit déjà passé,
  // laissant l'en-tête transparent sur fond clair. Absence de `#top` (toutes
  // les autres pages, ou avant montage) : reste opaque, l'état sûr.
  // Ailleurs qu'à l'accueil, l'écoute du défilement est inutile : l'en-tête
  // y est opaque en permanence, une valeur dérivée au rendu (ci-dessous)
  // plutôt qu'un état à synchroniser dans cet effet.
  useEffect(() => {
    if (!estAccueil) return
    function evaluer() {
      const hero = document.getElementById('top')
      const h = header.current
      if (!hero || !h) {
        setOpaqueDefilement(true)
        return
      }
      setOpaqueDefilement(hero.getBoundingClientRect().bottom <= h.getBoundingClientRect().height)
    }
    window.addEventListener('scroll', evaluer, { passive: true })
    window.addEventListener('resize', evaluer, { passive: true })
    evaluer()
    return () => {
      window.removeEventListener('scroll', evaluer)
      window.removeEventListener('resize', evaluer)
    }
  }, [estAccueil])

  const opaque = estAccueil ? opaqueDefilement : true

  return (
    <header
      ref={header}
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
