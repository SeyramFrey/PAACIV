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

  useEffect(() => {
    if (!conteneur.current) return
    const map = new Map({
      container: conteneur.current,
      style: STYLE,
      center: [lng, lat],
      zoom: 14,
      attributionControl: { compact: true },
    })
    const marqueur = new Marker({ color: '#B5581F' }).setLngLat([lng, lat]).addTo(map)
    if (titre) marqueur.setPopup(new Popup().setText(titre))
    if (onChoisir) {
      map.on('click', (e) => {
        onChoisir(e.lngLat.lat, e.lngLat.lng)
        marqueur.setLngLat(e.lngLat)
      })
    }
    return () => map.remove()
  }, [lat, lng, titre, onChoisir])

  return <div ref={conteneur} className="h-64 w-full overflow-hidden rounded-2xl" aria-label={titre} />
}
