'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
// maplibre-gl@6 n'expose plus d'export par défaut (mapbox-gl-like) : imports nommés.
import { Map, NavigationControl, Popup, LngLatBounds, type GeoJSONSource, type MapGeoJSONFeature } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import type { Ref } from '@/lib/data/patrimoine'
import type { ReferencesFiltres } from '@/lib/data/references'
import { construirePopupContenu } from '@/components/carte/popup'

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY
const STYLE = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  : 'https://tiles.openfreemap.org/styles/liberty'
const SATELLITE_TILES = MAPTILER_KEY
  ? `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`
  : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const SATELLITE_ATTR = MAPTILER_KEY
  ? '© MapTiler © OpenStreetMap contributors'
  : '© Esri'

export function CarteClient({ options, locale }: { options: ReferencesFiltres; locale: string }) {
  const t = useTranslations('carte')
  const router = useRouter()
  const conteneur = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const routerRef = useRef(router)
  const localeRef = useRef(locale)
  const [satellite, setSatellite] = useState(false)

  const nomType = (ty: Ref) => (locale === 'en' ? ty.nom_en || ty.nom_fr : ty.nom_fr)

  // Expression de couleur `match` sur type_id, stable tant que `options.types`
  // ne change pas (référence identique entre rendus dans notre usage).
  const couleurExpression = useMemo(() => {
    const couleurParType = options.types.map((ty) => [ty.id, ty.couleur ?? '#8A3E1B']).flat()
    return ['match', ['get', 'type_id'], ...couleurParType, '#8A3E1B'] as unknown as
      | string
      | number[]
  }, [options.types])

  // Map `type_id → { nom, couleur }` pour enrichir le popup au survol.
  // `globalThis.Map` évite la collision avec le `Map` importé de maplibre-gl.
  const typeInfo = useMemo(() => {
    const m = new globalThis.Map<string, { nom: string; couleur: string }>()
    for (const ty of options.types) m.set(ty.id, { nom: nomType(ty), couleur: ty.couleur ?? '#8A3E1B' })
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.types, locale])
  const typeInfoRef = useRef(typeInfo)

  useEffect(() => {
    routerRef.current = router
    localeRef.current = locale
  }, [router, locale])
  useEffect(() => {
    typeInfoRef.current = typeInfo
  }, [typeInfo])

  // Effet d'initialisation : NE DOIT s'exécuter qu'au montage. `couleurExpression`
  // est capturée dans la closure sans être une dépendance changeante (mémoïsée
  // sur `types`, stable en pratique), `router`/`locale` sont lus via des refs —
  // sinon chaque bascule Plan/Satellite (état local) détruirait et recréerait
  // toute la carte WebGL.
  useEffect(() => {
    if (!conteneur.current) return
    const map = new Map({
      container: conteneur.current,
      style: STYLE,
      center: [-5.5, 7.5], // Côte d'Ivoire
      zoom: 6,
    })
    mapRef.current = map
    ;(window as unknown as { __carteMap?: Map }).__carteMap = map
    map.addControl(new NavigationControl(), 'top-right')

    map.on('load', async () => {
      // Fond satellite (masqué par défaut). Inséré SANS beforeId : il se place
      // au-dessus du fond vectoriel mais sous les couches clusters/points
      // ajoutées ensuite — c'est le correctif du bug « satellite invisible ».
      map.addSource('satellite-src', {
        type: 'raster',
        tiles: [SATELLITE_TILES],
        tileSize: 256,
        attribution: SATELLITE_ATTR,
      })
      map.addLayer({ id: 'satellite', type: 'raster', source: 'satellite-src', layout: { visibility: 'none' } })

      // Points publiés (GeoJSON clusterisé). On récupère la collection nous-mêmes
      // pour pouvoir cadrer la carte sur les points (fitBounds) — sinon la carte
      // s'ouvre sur le centre du pays, loin des marqueurs regroupés près d'Abidjan.
      let fc: { features: { geometry: { coordinates: [number, number] } }[] } = { features: [] }
      try {
        fc = await (await fetch('/api/carte/points')).json()
      } catch {
        // repli : la carte reste centrée sur la Côte d'Ivoire (center/zoom initiaux).
      }
      map.addSource('patrimoine', {
        type: 'geojson',
        data: fc as unknown as GeoJSON.FeatureCollection,
        cluster: true,
        clusterRadius: 50,
      })

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'patrimoine',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#B5581F',
          'circle-opacity': 0.85,
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 30, 30],
        },
      })
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'patrimoine',
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 },
        paint: { 'text-color': '#F4EBDD' },
      })
      map.addLayer({
        id: 'points',
        type: 'circle',
        source: 'patrimoine',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#F4EBDD',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          'circle-color': couleurExpression as any,
        },
      })

      const popup = new Popup({ closeButton: false, closeOnClick: false })
      map.on('mouseenter', 'points', (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const f = e.features?.[0] as MapGeoJSONFeature | undefined
        if (!f) return
        const props = f.properties as {
          titre_fr: string; titre_en: string | null; ville: string | null
          type_id: string | null; image: string | null
        }
        const titre = localeRef.current === 'en' ? props.titre_en || props.titre_fr : props.titre_fr
        const info = props.type_id ? typeInfoRef.current.get(props.type_id) : undefined
        // Construction DOM sûre (pas de setHTML) : `titre`/`ville` viennent de
        // la BDD et ne doivent jamais être interprétés comme du HTML.
        const contenu = construirePopupContenu({
          titre,
          ville: props.ville,
          image: props.image,
          typeNom: info?.nom ?? null,
          typeCouleur: info?.couleur ?? null,
        })
        popup
          .setLngLat((f.geometry as unknown as { coordinates: [number, number] }).coordinates)
          .setDOMContent(contenu)
          .addTo(map)
      })
      map.on('mouseleave', 'points', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })
      map.on('click', 'points', (e) => {
        const f = e.features?.[0]
        const slug = f?.properties?.slug as string | undefined
        if (slug) routerRef.current.push(`/patrimoine/${slug}`)
      })
      map.on('click', 'clusters', async (e) => {
        const f = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0]
        if (!f) return
        const src = map.getSource('patrimoine') as GeoJSONSource
        const zoom = await src.getClusterExpansionZoom(f.properties.cluster_id as number)
        map.easeTo({ center: (f.geometry as unknown as { coordinates: [number, number] }).coordinates, zoom })
      })

      // Cadre la carte sur les points publiés (marge + zoom max raisonnable).
      const coords = fc.features.map((feat) => feat.geometry.coordinates)
      if (coords.length > 0) {
        const bounds = coords.reduce(
          (b, c) => b.extend(c),
          new LngLatBounds(coords[0], coords[0]),
        )
        map.fitBounds(bounds, { padding: 80, maxZoom: 11, duration: 0 })
      }

      ;(window as unknown as { __carteReady?: boolean }).__carteReady = true
    })

    return () => map.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialisation unique au montage ; router/locale lus via refs, couleurExpression capturée par closure.
  }, [])

  function basculerSatellite() {
    const map = mapRef.current
    if (!map) return
    const visible = !satellite
    map.setLayoutProperty('satellite', 'visibility', visible ? 'visible' : 'none')
    setSatellite(visible)
  }

  return (
    <div className="relative h-[calc(100vh-8rem)] w-full">
      <div ref={conteneur} className="h-full w-full" />

      {/* Bascule Plan / Satellite */}
      <div className="absolute left-3 top-3 flex overflow-hidden rounded-full bg-white shadow">
        <button
          type="button"
          onClick={() => satellite && basculerSatellite()}
          className={`px-4 py-2 text-sm font-semibold ${!satellite ? 'bg-or text-encre' : 'text-brun'}`}
        >
          {t('plan')}
        </button>
        <button
          type="button"
          onClick={() => !satellite && basculerSatellite()}
          className={`px-4 py-2 text-sm font-semibold ${satellite ? 'bg-or text-encre' : 'text-brun'}`}
        >
          {t('satellite')}
        </button>
      </div>

      {/* Légende */}
      <section
        role="region"
        aria-label={t('legende')}
        className="absolute bottom-3 left-3 max-w-xs rounded-2xl bg-white/95 p-4 shadow"
      >
        <h2 className="mb-2 font-serif text-sm text-brun">{t('legende')}</h2>
        <ul className="grid grid-cols-1 gap-1 text-xs">
          {options.types.map((ty) => (
            <li key={ty.id} data-testid="legende-type" className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: ty.couleur ?? '#8A3E1B' }}
              />
              {nomType(ty)}
            </li>
          ))}
        </ul>
      </section>

      {/* Inset « CI en Afrique » */}
      <div className="absolute right-3 top-16 hidden h-24 w-24 items-center justify-center rounded-lg bg-vert/90 text-[10px] font-semibold text-sable shadow sm:flex">
        CI · Afrique
      </div>
    </div>
  )
}
