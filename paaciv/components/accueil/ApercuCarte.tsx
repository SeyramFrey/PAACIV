'use client'

import { useEffect, useRef, useState } from 'react'
import { Map } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { STYLE_CARTE, COULEUR_DEFAUT } from '@/lib/carte-style'
import type { Ref } from '@/lib/data/patrimoine'

// Cadrage sur la Côte d'Ivoire. Fixe plutôt que calculé sur les points : un
// `fitBounds` sur trois fiches d'Abidjan zoomerait sur un quartier et le bloc
// perdrait sa lecture « territoire ».
const CENTRE: [number, number] = [-5.55, 7.54]
const ZOOM = 5.4

export function ApercuCarte({
  types,
  nombre,
  surtitre,
  titre,
  texte,
}: {
  types: Ref[]
  nombre: number
  surtitre: string
  titre: string
  texte: string
}) {
  const t = useTranslations('accueil')
  const conteneur = useRef<HTMLDivElement>(null)
  const [pret, setPret] = useState(false)
  const [visible, setVisible] = useState(false)

  // La carte est décorative sur la page la plus visitée du site : sans ce
  // garde, elle s'initialise (contexte WebGL, requête réseau, chunk
  // MapLibre-GL de 785 Ko déjà retiré du bundle initial par
  // `ApercuCarteLoader.tsx`) que le visiteur y arrive ou non. `rootMargin:
  // '200px'` laisse une marge d'anticipation : la carte est prête un peu
  // avant que le conteneur n'entre réellement dans le viewport, pas
  // seulement au pixel exact.
  useEffect(() => {
    if (!conteneur.current) return
    const observateur = new IntersectionObserver(
      (entrees) => {
        if (entrees[0]?.isIntersecting) {
          setVisible(true)
          observateur.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observateur.observe(conteneur.current)
    return () => observateur.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || !conteneur.current) return
    let annule = false
    const map = new Map({
      container: conteneur.current,
      style: STYLE_CARTE,
      center: CENTRE,
      zoom: ZOOM,
      attributionControl: { compact: true },
      // La carte est décorative : sans ce réglage, un défilement de page qui
      // passe sur le carré zoomerait la carte au lieu de continuer la page.
      scrollZoom: false,
      dragRotate: false,
      keyboard: false,
    })

    // Même garde que `CarteClient.tsx` (commit 663e88c) : quitter `/fr` avant
    // la fin du chargement — ou le double montage de StrictMode en dev —
    // appelle `map.remove()`, qui annule les requêtes encore en vol. L'erreur
    // en résulte est émise par le `Style`, détaché de la carte avant
    // l'annulation : seul un écouteur posé directement dessus peut l'absorber
    // (voir le commentaire détaillé dans CarteClient.tsx).
    map.style.on('error', () => {})

    const couleurParType = types.flatMap((ty) => [ty.id, ty.couleur ?? COULEUR_DEFAUT])

    map.on('load', async () => {
      // Le `try` ne couvre plus que la requête réseau (comme `CarteClient`) :
      // il englobait auparavant aussi `addSource`/`addLayer`, si bien qu'une
      // géométrie malformée aurait été avalée avec le même silence qu'un
      // réseau indisponible, sans trace pour la distinguer.
      let geojson: unknown
      try {
        const reponse = await fetch('/api/carte/points')
        if (!reponse.ok) {
          console.error('carte/points', reponse.status, reponse.statusText)
          return
        }
        geojson = await reponse.json()
      } catch (erreurReseau) {
        // Réseau indisponible ou réponse non JSON : la carte reste vide
        // plutôt que de lever un rejet de promesse non géré.
        console.error('carte/points réseau', erreurReseau)
        return
      }

      // Le composant peut avoir démonté pendant l'attente du réseau : sans
      // ce garde, `addSource`/`addLayer` lèveraient sur une carte détruite.
      if (annule) return

      try {
        // Même conversion que `CarteClient.tsx` pour la même API : la
        // réponse JSON est typée `unknown` par prudence (E2, revue finale),
        // pas `any` implicite comme avant.
        map.addSource('points', { type: 'geojson', data: geojson as unknown as GeoJSON.FeatureCollection })
        map.addLayer({
          id: 'points',
          type: 'circle',
          source: 'points',
          paint: {
            'circle-radius': 5,
            'circle-color':
              couleurParType.length > 0
                ? (['match', ['get', 'type_id'], ...couleurParType, COULEUR_DEFAUT] as never)
                : COULEUR_DEFAUT,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': 'rgba(255,255,255,.8)',
          },
        })
        setPret(true)
      } catch (erreurGeometrie) {
        console.error('carte/points géométrie', erreurGeometrie)
      }
    })

    return () => {
      annule = true
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialisation unique à l'intersection ; `types` capturé par closure, il ne change pas après le rendu serveur.
  }, [visible])

  return (
    <section
      className="px-[clamp(20px,5vw,80px)] py-20 lg:py-32"
      style={{ background: 'var(--deep)', color: 'var(--onDeep)' }}
    >
      <div className="mx-auto max-w-3xl text-center">
        <p data-rv="" className="text-[10px] uppercase tracking-[0.24em] opacity-60">{surtitre}</p>
        <h2 data-rv="" data-d="60" className="mt-3 font-serif text-4xl lg:text-6xl">{titre}</h2>
        <p data-rv="" data-d="120" className="mt-5 opacity-75">{texte}</p>
      </div>

      <div
        data-rv=""
        data-d="180"
        className="mx-auto mt-12 w-[min(720px,100%)] overflow-hidden rounded border"
        style={{ borderColor: 'color-mix(in oklab, var(--onDeep) 22%, transparent)' }}
      >
        {/* Carré strict, demandé explicitement. `aspect-square` + hauteur
            pilotée par la largeur : MapLibre a besoin d'un conteneur mesuré.
            Pas d'`aria-label` ici : un `<div>` sans rôle explicite l'ignore
            selon la spécification ARIA, et il ferait de toute façon doublon
            avec le `aria-live` du paragraphe voisin ci-dessous. */}
        <div ref={conteneur} className="aspect-square w-full" />
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-sm opacity-70" aria-live="polite">
          {pret ? t('edifices', { n: nombre }) : null}
        </p>
        <Link
          href="/carte"
          className="rounded-full px-8 py-4 text-sm font-semibold transition hover:-translate-y-0.5"
          style={{ background: 'var(--accent)', color: 'oklch(0.15 0.012 45)' }}
        >
          {t('ouvrirCarte')}
        </Link>
      </div>
    </section>
  )
}
