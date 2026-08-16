'use client'

import { useEffect, useRef } from 'react'
// maplibre-gl@6 n'expose plus d'export par défaut (mapbox-gl-like) : imports nommés.
import { Map, Marker, Popup } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const STYLE = 'https://tiles.openfreemap.org/styles/liberty'

export function MiniCarte({
  lat,
  lng,
  titre,
  onChoisir,
}: {
  lat: number
  lng: number
  titre?: string
  onChoisir?: (lat: number, lng: number) => void
}) {
  const conteneur = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const marqueurRef = useRef<Marker | null>(null)
  const onChoisirRef = useRef(onChoisir)

  // Garde le callback à jour sans jamais réinitialiser la carte : dans le
  // formulaire admin, `onChoisir` est une nouvelle closure à chaque rendu.
  useEffect(() => {
    onChoisirRef.current = onChoisir
  }, [onChoisir])

  // Initialisation UNIQUE au montage. Sans cela, dans le formulaire admin où
  // `lat`/`lng` changent à chaque clic sur la carte, cet effet détruirait et
  // recréerait la carte WebGL à chaque sélection de point.
  useEffect(() => {
    if (!conteneur.current) return
    const map = new Map({
      container: conteneur.current,
      style: STYLE,
      center: [lng, lat],
      zoom: 14,
      attributionControl: { compact: true },
    })
    mapRef.current = map
    const marqueur = new Marker({ color: '#B5581F' }).setLngLat([lng, lat]).addTo(map)
    marqueurRef.current = marqueur
    if (titre) marqueur.setPopup(new Popup().setText(titre))
    map.on('click', (e) => {
      marqueur.setLngLat(e.lngLat)
      onChoisirRef.current?.(e.lngLat.lat, e.lngLat.lng)
    })
    return () => {
      map.remove()
      mapRef.current = null
      marqueurRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialisation unique au montage ; lat/lng/titre initiaux capturés par closure, onChoisir lu via ref.
  }, [])

  // Suivi des coordonnées venues de l'EXTÉRIEUR (saisie au clavier dans les
  // champs lat/lng du formulaire d'administration). L'effet d'initialisation
  // ci-dessus ne s'exécute qu'une fois — indispensable, sinon chaque clic sur
  // la carte détruirait le contexte WebGL — si bien que le marqueur restait
  // figé pendant qu'on tapait les coordonnées : l'administrateur devait
  // enregistrer pour voir où tombait son point.
  //
  // La carte n'est PAS recentrée à chaque frappe : recadrer sur « 5 » puis
  // « 5.3 » puis « 5.32 » ferait sauter la vue à chaque caractère. On ne se
  // déplace que si le point sort du cadre visible, et en `easeTo` pour garder
  // le repère visuel.
  useEffect(() => {
    const map = mapRef.current
    const marqueur = marqueurRef.current
    if (!map || !marqueur) return
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    // BORNES OBLIGATOIRES. `setLngLat` LÈVE sur une latitude hors [-90, 90]
    // (« Invalid LngLat latitude value ») — et cette exception, jetée depuis
    // un effet, casse le rendu de tout le formulaire : l'administrateur ne
    // peut plus ni corriger sa saisie ni enregistrer. Or l'écran de saisie est
    // précisément l'endroit où une latitude aberrante existe, le temps de
    // taper « 5.32 » on passe par « 5 », et une faute de frappe (« 5000 »)
    // est le cas que les gardes du formulaire sont là pour rattraper.
    // Le point hors bornes est donc ignoré, pas appliqué : les trois barrières
    // existantes (min/max du champ, action serveur, contrainte CHECK) font le
    // reste du travail.
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return
    const actuel = marqueur.getLngLat()
    if (actuel.lat === lat && actuel.lng === lng) return
    marqueur.setLngLat([lng, lat])
    if (!map.getBounds().contains([lng, lat])) map.easeTo({ center: [lng, lat], duration: 500 })
  }, [lat, lng])

  return <div ref={conteneur} className="h-64 w-full overflow-hidden rounded-2xl" aria-label={titre} />
}
