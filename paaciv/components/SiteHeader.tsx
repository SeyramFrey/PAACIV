'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { BasculeTheme } from '@/components/ui/BasculeTheme'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { MenuMobile, type Entree } from '@/components/MenuMobile'
import { useSoutien } from '@/components/soutenir/ContexteSoutien'
import { Logo } from '@/components/ui/Logo'

// Huit entrées, une par rubrique du site. Les ancres du design (#archive,
// #journal…) sont remplacées par les vraies routes : le header est partagé
// par toutes les pages, où ces ancres ne mèneraient nulle part.
const ENTREES: readonly Entree[] = [
  { href: '/carte', cle: 'carte' },
  { href: '/a-propos', cle: 'apropos' },
  { href: '/archives', cle: 'archives' },
  // Juste après l'archive : les communes sont une AUTRE entrée dans le même
  // corpus — par le lieu plutôt que par la fiche —, pas une rubrique de plus.
  { href: '/villes', cle: 'villes' },
  { href: '/architectes', cle: 'architectes' },
  { href: '/articles', cle: 'articles' },
  { href: '/reportages', cle: 'reportages' },
  { href: '/evenements', cle: 'evenements' },
] as const

export function SiteHeader() {
  const t = useTranslations('nav')
  const { ouvrir } = useSoutien()
  const pathname = usePathname()
  // La condition n'est plus « est-on à l'accueil ? » mais « cette page
  // pose-t-elle un hero sombre ? ». Le gabarit de fiche architecte en pose un
  // lui aussi depuis qu'il suit la maquette, et le critère par chemin aurait
  // demandé une expression régulière de plus à chaque page qui s'y ajoute.
  // Le marqueur est le même qu'avant — l'élément `#top` — et l'effet ci-dessous
  // mesure déjà son bas RÉEL : une page sans `#top` n'installe rien et reste
  // opaque, l'état sûr. C'est exactement ce qu'il faut partout ailleurs
  // (carte, login, admin…), où un en-tête transparent écrirait du texte clair
  // sur fond clair, illisible en permanence.
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
    // Pas de hero sur cette page : aucun écouteur à installer. Le test à
    // l'entrée remplace l'ancien garde `if (!estAccueil)`. On ne repose PAS
    // l'état ici — un `setState` synchrone dans le corps d'un effet déclenche
    // une cascade de rendus ; c'est le nettoyage de la page précédente qui a
    // déjà remis l'opacité, et l'état initial vaut déjà `true` au tout premier
    // montage.
    if (!document.getElementById('top')) return
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
      // Quitter une page à hero remet l'en-tête à l'état SÛR. Sans cela, une
      // fiche quittée alors qu'on était encore sur son hero laisserait
      // `opaqueDefilement` à `false`, et la page suivante — sans hero, donc
      // sans écouteur pour corriger — afficherait un en-tête transparent
      // écrivant du texte clair sur fond clair.
      setOpaqueDefilement(true)
    }
    // `pathname` et non `[]` : le layout n'est pas remonté d'une page à
    // l'autre, et sans cette dépendance une fiche atteinte par <Link> depuis
    // une page sans hero n'installerait jamais l'écoute.
  }, [pathname])

  const opaque = opaqueDefilement

  return (
    <header
      ref={header}
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-6 px-5 py-4 backdrop-blur-[14px] transition-[background-color] duration-500 sm:px-8 lg:px-14"
      style={{
        background: opaque ? 'color-mix(in oklab, var(--bg) 82%, transparent)' : 'transparent',
        color: opaque ? 'var(--ink)' : 'var(--onDeep)',
      }}
    >
      <Link href="/" className="flex shrink-0 items-center" style={{ color: 'inherit' }} aria-label="PAACIV">
        {/* Variante pilotée par `opaque`, pas par le thème : tant que l'en-tête
            est transparent il repose sur le hero, sombre dans les deux thèmes.
            Une fois opaque il est sur `--bg`, qui suit le thème, lui. */}
        <Logo variante={opaque ? 'auto' : 'surSombre'} compact hauteur={52} priorite />
      </Link>

      <nav aria-label={t('principale')} className="hidden xl:block">
        <ul className="flex items-center gap-6 whitespace-nowrap text-sm 2xl:gap-7">
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
        <div className="hidden xl:flex xl:items-center xl:gap-3">
          <LanguageSwitcher />
          <BasculeTheme className="rounded-full border p-2 transition hover:bg-[var(--accent)] hover:text-[var(--surAccent)]" />
          <button
            type="button"
            onClick={() => ouvrir('adhesion')}
            className="rounded-full px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
            style={{ background: 'var(--accent)', color: 'var(--surAccent)' }}
          >
            {t('adherer')}
          </button>
        </div>
        <MenuMobile entrees={ENTREES} />
      </div>
    </header>
  )
}
