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

  useEffect(() => {
    if (!conteneur.current) return
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

    const couleurParType = types.flatMap((ty) => [ty.id, ty.couleur ?? COULEUR_DEFAUT])

    map.on('load', async () => {
      const reponse = await fetch('/api/carte/points')
      const geojson = await reponse.json()
      map.addSource('points', { type: 'geojson', data: geojson })
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
    })

    return () => map.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialisation unique au montage ; `types` capturé par closure, il ne change pas après le rendu serveur.
  }, [])

  return (
    <section
      className="px-5 py-20 sm:px-8 lg:px-14 lg:py-32"
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
            pilotée par la largeur : MapLibre a besoin d'un conteneur mesuré. */}
        <div ref={conteneur} className="aspect-square w-full" aria-label={t('edifices', { n: nombre })} />
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
