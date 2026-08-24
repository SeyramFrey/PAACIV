'use client'

import { useEffect, useRef } from 'react'
import { Map, Marker, Popup, LngLatBounds } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { STYLE_CARTE, COULEUR_DEFAUT } from '@/lib/carte-style'

export type PointVille = {
  slug: string
  titre: string
  lat: number
  lng: number
  couleur: string | null
}

// Extrait de carte d'une commune.
//
// Distinct de `MiniCarte`, et pour une raison de fond : `MiniCarte` montre UN
// point, à zoom fixe, et sert d'abord à SAISIR une coordonnée dans le
// formulaire d'administration (elle écoute le clic, elle suit une saisie au
// clavier). Ici on montre N points en lecture seule, et c'est le cadrage qui
// porte l'information — voir que les cinq édifices d'Abidjan tiennent dans le
// Plateau dit quelque chose qu'un point centré ne dit pas. Réunir les deux
// donnerait un composant à deux modes dont chaque effet commencerait par
// demander dans lequel il est.
//
// Le style de fond est celui de `/carte` (`STYLE_CARTE`, avec son repli
// OpenFreeMap si la clé MapTiler manque) : un extrait qui n'aurait pas le même
// fond que la carte réelle serait un mensonge visuel — c'est déjà la raison
// pour laquelle `lib/carte-style.ts` existe.
export function CarteVille({ points, hauteur = 300 }: { points: PointVille[]; hauteur?: number }) {
  const conteneur = useRef<HTMLDivElement>(null)
  // Les points sont lus une seule fois, au montage, via une ref : un tableau
  // reconstruit à chaque rendu par le composant parent détruirait et recréerait
  // le contexte WebGL à chaque fois s'il figurait dans les dépendances. Même
  // précaution que `CarteClient` et `MiniCarte`.
  const pointsRef = useRef(points)

  useEffect(() => {
    const hote = conteneur.current
    if (!hote) return
    const liste = pointsRef.current
    if (liste.length === 0) return

    const map = new Map({
      container: hote,
      style: STYLE_CARTE,
      center: [liste[0].lng, liste[0].lat],
      zoom: 12,
      attributionControl: { compact: true },
    })

    // Même piège que sur `/carte` : quitter la page avant la fin du chargement
    // appelle `map.remove()`, qui annule les requêtes en vol ; l'AbortError qui
    // en résulte est émise par le Style, déjà détaché de la carte. Sans cet
    // écouteur — volontairement vide — elle finit dans `console.error`, dont
    // Next 16 fait une carte d'erreur bloquante.
    map.style.on('error', () => {})

    for (const p of liste) {
      const marqueur = new Marker({ color: p.couleur ?? COULEUR_DEFAUT })
        .setLngLat([p.lng, p.lat])
        .addTo(map)
      // `setText` et non `setHTML` : le titre vient de la base et ne doit
      // jamais être interprété comme du HTML.
      marqueur.setPopup(new Popup({ offset: 24 }).setText(p.titre))
    }

    if (liste.length > 1) {
      const bounds = liste.reduce(
        (b, p) => b.extend([p.lng, p.lat]),
        new LngLatBounds([liste[0].lng, liste[0].lat], [liste[0].lng, liste[0].lat]),
      )
      // `maxZoom` : sans lui, deux édifices voisins de trente mètres feraient
      // un cadrage au niveau du trottoir, où l'on ne reconnaît plus la ville.
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 })
    }

    return () => map.remove()
  }, [])

  if (points.length === 0) return null

  return (
    <div
      ref={conteneur}
      className="filet-double w-full overflow-hidden rounded-2xl"
      style={{ height: hauteur }}
    />
  )
}
