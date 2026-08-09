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

  return <div ref={conteneur} className="h-64 w-full overflow-hidden rounded-2xl" aria-label={titre} />
}
