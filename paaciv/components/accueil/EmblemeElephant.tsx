'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import type { Groupe, SceneElephant } from './scene-elephant'

// L'éléphant de l'emblème, en volume : la section qui suit le haut de page
// (décision du 7 novembre 2026 : le haut garde son film, l'éléphant prend la
// suite).
//
// Les quatre patrimoines sont des éclats du corps. Chacun ouvre sa fiche, sauf
// la mosquée tant que sa fiche n'existe pas : un éclat qui se soulève sans
// rien ouvrir serait un gadget (garde-fou de l'exploration, § 4).
//
// Chargement en trois temps :
// 1. au rendu serveur, une image fixe (WebP, 34 à 52 Ko) et la légende, qui
//    porte les liens : tout fonctionne déjà, sans une ligne de JS 3D ;
// 2. quand la section approche de l'écran, et seulement sur un appareil
//    capable (WebGL, ni mode léger, ni économiseur de données), three.js et
//    le modèle (1,1 Mo) sont chargés ;
// 3. la 3D apparaît en fondu par-dessus l'image, au même cadrage.
const AFFICHE = '/3d/elephant/elephant-affiche-1400.webp'
const AFFICHE_800 = '/3d/elephant/elephant-affiche-800.webp'
const MODELE = '/3d/elephant/elephant-eclats.glb'
const DECODEUR = '/draco/'

const PIECES: { groupe: Groupe; href: string | null }[] = [
  { groupe: 'basilique', href: '/patrimoine/basilique-yamoussoukro' },
  { groupe: 'pyramide', href: '/patrimoine/la-pyramide-abidjan' },
  { groupe: 'carte', href: '/carte' },
  // Fiche « Mosquées de style soudanais du Nord ivoirien » à créer : l'éclat
  // deviendra cliquable en renseignant son adresse ici.
  { groupe: 'mosquee', href: null },
]
const ACTIFS = new Set(PIECES.filter((p) => p.href).map((p) => p.groupe))

function appareilCapable() {
  if (document.documentElement.hasAttribute('data-leger')) return false
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
  if (nav.connection?.saveData) return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function EmblemeElephant() {
  const t = useTranslations('accueil.embleme')
  const router = useRouter()
  const section = useRef<HTMLElement>(null)
  const scene = useRef<HTMLDivElement>(null)
  const api = useRef<SceneElephant | null>(null)
  const [pret, setPret] = useState(false)
  const [actif, setActif] = useState<Groupe | null>(null)
  // Le routeur n'est pas garanti stable d'un rendu à l'autre : en dépendance
  // de l'effet, il détruisait la scène à chaque survol (le survol change un
  // état, donc provoque un rendu). Il est lu au moment du clic.
  const routeur = useRef(router)
  useEffect(() => {
    routeur.current = router
  }, [router])

  useEffect(() => {
    const s = section.current
    const hote = scene.current
    if (!s || !hote || !appareilCapable()) return
    let annule = false
    const obs = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting) return
        obs.disconnect()
        const { monterSceneElephant } = await import('./scene-elephant')
        if (annule) return
        try {
          api.current = monterSceneElephant({
            hote,
            modele: MODELE,
            decodeur: DECODEUR,
            actifs: ACTIFS,
            mouvementReduit: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            auSurvol: setActif,
            auClic: (g) => {
              const href = PIECES.find((p) => p.groupe === g)?.href
              if (href) routeur.current.push(href)
            },
            pret: () => setPret(true),
            // Modèle introuvable ou WebGL perdu : l'image fixe reste, rien ne casse.
            echec: () => setPret(false),
          })
        } catch (err) {
          // Contexte WebGL refusé (pilote, onglet en arrière-plan…) : l'image
          // fixe et la légende restent, la page ne casse pas.
          console.warn('Éléphant 3D indisponible', err)
        }
      },
      // Commence le chargement un peu avant l'arrivée de la section.
      { rootMargin: '400px 0px' },
    )
    obs.observe(s)
    return () => {
      annule = true
      obs.disconnect()
      api.current?.detruire()
      api.current = null
    }
  }, [])

  function surligner(g: Groupe | null) {
    setActif(g)
    api.current?.surligner(g)
  }

  return (
    <section
      id="embleme"
      ref={section}
      aria-labelledby="embleme-titre"
      className="bande-tole relative overflow-hidden px-[clamp(20px,6vw,96px)] py-[clamp(72px,10vw,140px)]"
      style={{ background: 'var(--deep)', color: 'var(--onDeep)' }}
    >
      <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="min-w-0">
          <p
            className="mb-5 text-[11px] font-medium uppercase tracking-[0.3em]"
            style={{ color: 'var(--accent)' }}
          >
            {t('surtitre')}
          </p>
          <h2
            id="embleme-titre"
            className="m-0 font-serif text-[clamp(34px,4.2vw,64px)] leading-[1.02] tracking-[-0.015em] text-balance"
          >
            {t('titre')}
          </h2>
          <p
            className="mt-6 max-w-[520px] text-[17px] font-light leading-[1.75]"
            style={{ color: 'color-mix(in oklab, var(--onDeep) 82%, transparent)' }}
          >
            {t('texte')}
          </p>

          {/* La légende est la vraie navigation : liens au clavier et au
              lecteur d'écran, et version complète quand la 3D ne se charge
              pas. Le canvas, lui, est `aria-hidden`. */}
          <nav aria-label={t('navigation')} className="mt-10">
            <ol className="m-0 list-none border-t p-0" style={{ borderColor: 'color-mix(in oklab, var(--onDeep) 18%, transparent)' }}>
              {PIECES.map((p, i) => {
                const contenu = (
                  <>
                    <span className="w-6 flex-none font-serif text-[15px] opacity-60" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-serif text-[21px] leading-tight">{t(`${p.groupe}.titre`)}</span>
                      <span className="mt-1 block text-[13px] opacity-70">{t(`${p.groupe}.lieu`)}</span>
                    </span>
                    <span aria-hidden="true" className="flex-none text-[18px]">
                      {p.href ? '→' : ''}
                    </span>
                  </>
                )
                const style = {
                  borderColor: 'color-mix(in oklab, var(--onDeep) 18%, transparent)',
                  color: actif === p.groupe ? 'var(--accent)' : 'inherit',
                }
                return (
                  <li key={p.groupe}>
                    {p.href ? (
                      <Link
                        href={p.href}
                        data-testid={`embleme-${p.groupe}`}
                        className="flex items-center gap-4 border-b py-4 transition-colors focus-visible:outline-offset-4"
                        style={style}
                        onMouseEnter={() => surligner(p.groupe)}
                        onMouseLeave={() => surligner(null)}
                        onFocus={() => surligner(p.groupe)}
                        onBlur={() => surligner(null)}
                      >
                        {contenu}
                      </Link>
                    ) : (
                      <div
                        data-testid={`embleme-${p.groupe}`}
                        className="flex items-center gap-4 border-b py-4 opacity-75"
                        style={style}
                      >
                        {contenu}
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>

        <div className="relative order-first mx-auto -my-[8%] aspect-square w-full max-w-[760px] lg:order-none lg:my-0">
          {/* Image fixe au même cadrage que la caméra 3D : sous la 3D pendant
              le chargement, seule en mode léger ou sans WebGL. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={AFFICHE}
            srcSet={`${AFFICHE_800} 800w, ${AFFICHE} 1400w`}
            sizes="(min-width: 1024px) 760px, 100vw"
            alt={t('alt')}
            loading="lazy"
            decoding="async"
            data-testid="embleme-affiche"
            className="absolute inset-0 h-full w-full object-contain"
            style={{ opacity: pret ? 0 : 1, transition: 'opacity .6s ease' }}
          />
          <div
            ref={scene}
            data-testid="embleme-scene"
            data-pret={pret ? '' : undefined}
            className="absolute inset-0"
            style={{ opacity: pret ? 1 : 0, transition: 'opacity .6s ease' }}
          />
          <p className="absolute bottom-0 right-0 m-0 text-[11px] opacity-55">{t('credit')}</p>
        </div>
      </div>
    </section>
  )
}
