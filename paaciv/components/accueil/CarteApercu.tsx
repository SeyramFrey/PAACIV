'use client'

import { useEffect, useRef } from 'react'
import { Map } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { STYLE_CARTE, COULEUR_DEFAUT } from '@/lib/carte-style'
import type { Ref } from '@/lib/data/patrimoine'

// Ce module — et lui seul — importe MapLibre (785 Ko) et sa feuille de style.
// `ApercuCarte.tsx` le charge par `next/dynamic({ ssr: false })` et ne le
// monte qu'à l'intersection de la section avec le viewport, si bien qu'un
// visiteur qui ne descend jamais jusqu'à la carte ne télécharge pas le chunk.
//
// C'EST LA RAISON D'ÊTRE DU DÉCOUPAGE : tant que le garde d'intersection
// vivait dans le même module que `new Map()`, il fallait avoir téléchargé les
// 785 Ko pour pouvoir l'exécuter, et le garde ne différait donc que
// l'initialisation de la carte, pas son téléchargement.

// Cadrage sur la Côte d'Ivoire. Fixe plutôt que calculé sur les points : un
// `fitBounds` sur trois fiches d'Abidjan zoomerait sur un quartier et le bloc
// perdrait sa lecture « territoire ».
const CENTRE: [number, number] = [-5.55, 7.54]
const ZOOM = 5.4

export function CarteApercu({ types, onPret }: { types: Ref[]; onPret: () => void }) {
  const conteneur = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!conteneur.current) return
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
    // qui en résulte est émise par le `Style`, détaché de la carte avant
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
        onPret()
      } catch (erreurGeometrie) {
        console.error('carte/points géométrie', erreurGeometrie)
      }
    })

    return () => {
      annule = true
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialisation unique au montage, qui n'a lieu qu'à l'intersection ; `types` et `onPret` sont capturés par closure et ne changent pas après le rendu serveur.
  }, [])

  // Le carré est porté par le conteneur parent, dans `ApercuCarte.tsx` : il
  // doit exister AVANT ce composant pour être observé et pour réserver la
  // place, sans quoi la page sauterait au montage de la carte.
  return <div ref={conteneur} className="h-full w-full" />
}
