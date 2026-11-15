'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Map, NavigationControl, Popup, LngLatBounds, type GeoJSONSource, type MapGeoJSONFeature } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@/components/carte/worker'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import type { Ref } from '@/lib/data/patrimoine'
import type { ReferencesFiltres } from '@/lib/data/references'
import { construirePopupContenu } from '@/components/carte/popup'
import { FiltresCarte } from '@/components/carte/FiltresCarte'
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback'
import { styleDisponible, COULEUR_DEFAUT } from '@/lib/carte-style'
import { PictoType } from '@/components/ui/PictoType'
import { LigneHeure } from '@/components/ui/LigneHeure'
import { COULEUR_ETAT, ETATS_CONSERVATION, ETAT_RUINE, LISERET_ETAT_MOYEN, ombreEtat } from '@/lib/etats-conservation'
import { DUREE_EVENTAIL_MS, doitOuvrirEventail, positionsEventail, progressionEventail } from '@/lib/carte-eventail'

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY
const SATELLITE_TILES = MAPTILER_KEY
  ? `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`
  : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const SATELLITE_ATTR = MAPTILER_KEY
  ? '© MapTiler © OpenStreetMap contributors'
  : '© Esri'

// Couleur d'un point dont l'état n'est pas renseigné. Volontairement DIFFÉRENTE
// des quatre couleurs d'état, et volontairement terne : « on ne sait pas » est
// une information, et la confondre avec « intact » ferait de la carte des
// menaces un objet trompeur — exactement l'inverse de ce qu'elle sert à dire.
const COULEUR_ETAT_INCONNU = '#9AA0A6'

// Dernier zoom où les points proches se regroupent en amas. C'est la valeur
// par défaut de MapLibre (maxzoom de la source, 18, moins un), écrite ici
// parce que l'éventail en dépend : un amas qui ne se sépare qu'AU-DELÀ ne se
// séparera jamais à l'écran (lib/carte-eventail.ts).
const DERNIER_ZOOM_AMAS = 17

// Trait qui relie un point de l'éventail à sa position réelle : la latérite
// des amas, dont il sort.
const COULEUR_TRAIT_EVENTAIL = '#A9502A'

const COLLECTION_VIDE: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

type Lecture = 'type' | 'etat'

/**
 * Peinture des points selon la clé de lecture. Partagée par la couche des
 * points et par celle de l'éventail : un point écarté doit rester le même
 * point, de la même couleur.
 */
function peinturePoints(parEtat: boolean, couleurType: unknown, couleurEtat: unknown) {
  const ruine = ['==', ['get', 'etat_conservation'], ETAT_RUINE]
  return {
    'circle-color': parEtat ? couleurEtat : couleurType,
    // En lecture par état, les démolis sont RAPETISSÉS et estompés. La couleur
    // seule ne dit pas qu'il n'y a plus de bâtiment ; un point gris de même
    // taille que les autres se lit comme une catégorie parmi d'autres, alors
    // que c'est une absence. (Le popup, lui, rature le libellé.)
    'circle-radius': parEtat ? ['case', ruine, 5.5, 8] : 8,
    'circle-opacity': parEtat ? ['case', ruine, 0.55, 1] : 1,
    // Le safran d'« état moyen » est pâle sur le fond clair de la carte : son
    // point est cerné d'encre au lieu du liseré clair des autres.
    'circle-stroke-color': parEtat
      ? ['case', ['==', ['get', 'etat_conservation'], 'etat_moyen'], LISERET_ETAT_MOYEN, '#F6F1E7']
      : '#F6F1E7',
  } as const
}

export function CarteClient({ options, locale }: { options: ReferencesFiltres; locale: string }) {
  const t = useTranslations('carte')
  const tEtat = useTranslations('etats')
  const router = useRouter()
  const conteneur = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  // Refermer l'éventail depuis l'extérieur de l'effet d'initialisation (un
  // changement de filtres). Remplacée une fois la carte chargée.
  const fermerEventailRef = useRef<() => void>(() => {})
  const routerRef = useRef(router)
  const localeRef = useRef(locale)
  const [satellite, setSatellite] = useState(false)
  // Clé de lecture des points : la typologie (par défaut, « de quoi s'agit-il »)
  // ou l'état de conservation (« qu'est-ce qui est menacé »). Les deux
  // dessinent EXACTEMENT les mêmes points, sans rien recharger.
  const [lecture, setLecture] = useState<Lecture>('type')
  const [filtres, setFiltres] = useState({ type: '', programme: '', district: '', epoque: '', etat: '', q: '' })
  const [nombre, setNombre] = useState(0)
  const [mapPret, setMapPret] = useState(false)
  // Repli des filtres, PETIT ÉCRAN UNIQUEMENT. L'état de départ est `false`
  // pour tout le monde et c'est `sm:flex` qui redéploie la barre à partir de
  // 640 px : lire la largeur de la fenêtre au montage pour choisir l'état
  // initial ferait diverger le rendu serveur du rendu client.
  const [filtresOuverts, setFiltresOuverts] = useState(false)

  const nomType = (ty: Ref) => (locale === 'en' ? ty.nom_en || ty.nom_fr : ty.nom_fr)

  // Expression de couleur `match` sur type_id, stable tant que `options.types`
  // ne change pas (référence identique entre rendus dans notre usage).
  const couleurExpression = useMemo(() => {
    const couleurParType = options.types.map((ty) => [ty.id, ty.couleur ?? COULEUR_DEFAUT]).flat()
    return ['match', ['get', 'type_id'], ...couleurParType, COULEUR_DEFAUT] as unknown as
      | string
      | number[]
  }, [options.types])

  // Pendant de la précédente sur l'état de conservation. Le repli n'est PAS
  // `COULEUR_DEFAUT` mais une teinte dédiée : la valeur par défaut d'un
  // `match` attrape ici les points sans état renseigné, qui ne doivent surtout
  // pas se confondre avec une catégorie réelle.
  const couleurEtatExpression = useMemo(
    () =>
      [
        'match',
        ['get', 'etat_conservation'],
        ...ETATS_CONSERVATION.flatMap((e) => [e, COULEUR_ETAT[e]]),
        COULEUR_ETAT_INCONNU,
      ] as unknown as string | number[],
    [],
  )

  // Map `type_id → { nom, couleur }` pour enrichir le popup au survol.
  // `globalThis.Map` évite la collision avec le `Map` importé de maplibre-gl.
  const typeInfo = useMemo(() => {
    const m = new globalThis.Map<string, { nom: string; couleur: string }>()
    for (const ty of options.types) m.set(ty.id, { nom: nomType(ty), couleur: ty.couleur ?? COULEUR_DEFAUT })
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.types, locale])
  const typeInfoRef = useRef(typeInfo)

  // Libellés traduits des quatre états, pour le popup. Même mécanique que
  // `typeInfo` : le gestionnaire de survol est installé UNE FOIS au montage,
  // il ne peut donc pas lire directement une valeur qui change avec la langue.
  const etatInfo = useMemo(() => {
    const m = new globalThis.Map<string, { nom: string; couleur: string }>()
    for (const e of ETATS_CONSERVATION) m.set(e, { nom: tEtat(e), couleur: COULEUR_ETAT[e] })
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])
  const etatInfoRef = useRef(etatInfo)

  useEffect(() => {
    routerRef.current = router
    localeRef.current = locale
  }, [router, locale])
  useEffect(() => {
    typeInfoRef.current = typeInfo
  }, [typeInfo])
  useEffect(() => {
    etatInfoRef.current = etatInfo
  }, [etatInfo])

  // Effet d'initialisation : NE DOIT s'exécuter qu'au montage. `couleurExpression`
  // est capturée dans la closure sans être une dépendance changeante (mémoïsée
  // sur `options.types`, stable en pratique), `router`/`locale` sont lus via des refs —
  // sinon chaque bascule Plan/Satellite (état local) détruirait et recréerait
  // toute la carte WebGL.
  useEffect(() => {
    if (!conteneur.current) return
    // L'initialisation devient ASYNCHRONE : `styleDisponible()` vérifie d'abord
    // que MapTiler accepte la clé sur cette origine, et rend le fond libre
    // sinon (voir lib/carte-style.ts). `annule` couvre le cas où le visiteur
    // quitte la page pendant cette vérification — sans lui, on construirait une
    // carte WebGL dans un conteneur déjà démonté, que plus rien ne détruirait.
    let map: Map | null = null
    let annule = false
    // Posé au chargement de la carte, avec l'éventail qu'il referme (Échap).
    let retirerClavier = () => {}

    void (async () => {
      const style = await styleDisponible()
      if (annule || !conteneur.current) return
      map = new Map({
        container: conteneur.current,
        style,
        center: [-5.5, 7.5], // Côte d'Ivoire
        zoom: 6,
      })
      demarrer(map)
    })()

    function demarrer(map: Map) {
    mapRef.current = map
    ;(window as unknown as { __carteMap?: Map }).__carteMap = map
    map.addControl(new NavigationControl(), 'top-right')

    // Quitter /carte avant la fin du chargement appelle `map.remove()`, qui
    // annule les requêtes encore en vol (sprite, TileJSON, tuiles). L'AbortError
    // native qui en résulte (« signal is aborted without reason ») est émise en
    // évènement `error` par le Style — et `Map._updateStyle` a pris soin de le
    // détacher de la carte (`setEventedParent(null)`) AVANT de déclencher
    // l'annulation. Un `map.on('error')` ne peut donc rien intercepter :
    // l'écouteur doit être posé sur le style lui-même. Sans lui, `Evented.fire`
    // déverse l'erreur dans `console.error` faute d'écouteur — Next 16 en fait
    // une carte d'erreur bloquante posée sur la carte, et le bruit atteint aussi
    // la console des visiteurs en production (vérifié sur `next build`).
    //
    // La fenêtre s'ouvre à chaque montage en StrictMode (effet monté deux fois
    // en développement), à chaque Fast Refresh, et pour un visiteur qui quitte
    // la page trop tôt.
    //
    // L'écouteur est volontairement vide : sa seule présence suffit à empêcher
    // le repli sur `console.error`. Toute erreur NON liée à une annulation
    // continue de remonter à la carte (l'évènement est propagé au parent après
    // les écouteurs), qui la journalise exactement comme avant — journaliser
    // ici en plus la ferait apparaître deux fois.
    map.style.on('error', () => {})

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
        clusterMaxZoom: DERNIER_ZOOM_AMAS,
      })

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'patrimoine',
        filter: ['has', 'point_count'],
        paint: {
          // Un amas mélange les typologies comme les états : sa couleur ne
          // peut appartenir ni à l'une ni à l'autre légende. C'est la latérite
          // de la palette, la même que `--color-terracotta`.
          'circle-color': '#A9502A',
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
        paint: { 'text-color': '#F6F1E7' },
      })
      map.addLayer({
        id: 'points',
        type: 'circle',
        source: 'patrimoine',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-stroke-width': 2,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(peinturePoints(false, couleurExpression, couleurEtatExpression) as any),
        },
      })

      // L'éventail des points confondus (lib/carte-eventail.ts) : une source
      // à part, vide tant qu'il est fermé, dessinée AU-DESSUS des amas et des
      // points. Les traits relient chaque point écarté à sa position réelle.
      map.addSource('eventail', { type: 'geojson', data: COLLECTION_VIDE })
      map.addLayer({
        id: 'eventail-traits',
        type: 'line',
        source: 'eventail',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: { 'line-color': COULEUR_TRAIT_EVENTAIL, 'line-width': 1.5, 'line-opacity': 0.8 },
      })
      map.addLayer({
        id: 'eventail-points',
        type: 'circle',
        source: 'eventail',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-stroke-width': 2,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(peinturePoints(false, couleurExpression, couleurEtatExpression) as any),
        },
      })

      const popup = new Popup({ closeButton: false, closeOnClick: false })

      // Ouvert : l'amas dont il sort (null pour une pile de points au-delà du
      // dernier zoom d'amas, qui n'a pas d'amas à estomper).
      let eventail: { amas: number | null } | null = null
      let animation = 0
      const sourceEventail = () => map.getSource('eventail') as GeoJSONSource | undefined

      function estomperAmas(amas: number | null) {
        const cible = ['==', ['get', 'cluster_id'], amas ?? -1]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.setPaintProperty('clusters', 'circle-opacity', ['case', cible, 0.35, 0.85] as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.setPaintProperty('cluster-count', 'text-opacity', ['case', cible, 0.35, 1] as any)
      }

      function fermerEventail() {
        if (!eventail) return
        cancelAnimationFrame(animation)
        eventail = null
        sourceEventail()?.setData(COLLECTION_VIDE)
        estomperAmas(null)
        popup.remove()
        map.getCanvas().style.cursor = ''
      }
      fermerEventailRef.current = fermerEventail

      // Les décalages sont des PIXELS, convertis en coordonnées au zoom
      // courant : un zoom les fausserait, il referme donc l'éventail.
      function ouvrirEventail(lieu: [number, number], feuilles: { properties: unknown }[], amas: number | null) {
        fermerEventail()
        // Copies en objets ORDINAIRES : les propriétés que rend
        // `queryRenderedFeatures` n'ont pas de prototype, et `setData` ne sait
        // pas les transmettre à son worker (« _classRegistryKey » de undefined).
        const centre: [number, number] = [lieu[0], lieu[1]]
        const proprietes = feuilles.map((f) => ({ ...(f.properties as object) }))
        const decalages = positionsEventail(feuilles.length)
        const origine = map.project(centre)
        const dessiner = (k: number) => {
          const features: GeoJSON.Feature[] = []
          decalages.forEach(([dx, dy], i) => {
            const position = map.unproject([origine.x + dx * k, origine.y + dy * k]).toArray() as [number, number]
            features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [centre, position] }, properties: {} })
            features.push({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: position },
              properties: proprietes[i],
            })
          })
          sourceEventail()?.setData({ type: 'FeatureCollection', features })
        }
        eventail = { amas }
        estomperAmas(amas)
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          dessiner(1)
          return
        }
        const debut = performance.now()
        const image = (maintenant: number) => {
          const t = (maintenant - debut) / DUREE_EVENTAIL_MS
          dessiner(progressionEventail(t))
          if (t < 1 && eventail) animation = requestAnimationFrame(image)
        }
        animation = requestAnimationFrame(image)
      }

      map.on('zoomstart', fermerEventail)
      // Un clic dans le vide referme ; un clic sur un amas, un point ou un
      // point de l'éventail est laissé à son propre gestionnaire.
      map.on('click', (e) => {
        if (!eventail) return
        const touche = map.queryRenderedFeatures(e.point, { layers: ['eventail-points', 'clusters', 'points'] })
        if (touche.length === 0) fermerEventail()
      })
      const auClavier = (e: KeyboardEvent) => {
        if (e.key === 'Escape') fermerEventail()
      }
      window.addEventListener('keydown', auClavier)
      retirerClavier = () => window.removeEventListener('keydown', auClavier)

      function survoler(e: { features?: MapGeoJSONFeature[] }) {
        map.getCanvas().style.cursor = 'pointer'
        const f = e.features?.[0] as MapGeoJSONFeature | undefined
        if (!f) return
        const props = f.properties as {
          titre_fr: string; titre_en: string | null; ville: string | null
          type_id: string | null; etat_conservation: string | null; image: string | null
        }
        const titre = localeRef.current === 'en' ? props.titre_en || props.titre_fr : props.titre_fr
        const info = props.type_id ? typeInfoRef.current.get(props.type_id) : undefined
        // Une valeur hors vocabulaire rend `undefined` et la ligne disparaît,
        // plutôt que d'afficher un slug brut au visiteur.
        const etat = props.etat_conservation
          ? etatInfoRef.current.get(props.etat_conservation)
          : undefined
        // Construction DOM sûre (pas de setHTML) : `titre`/`ville` viennent de
        // la BDD et ne doivent jamais être interprétés comme du HTML.
        const contenu = construirePopupContenu({
          titre,
          ville: props.ville,
          image: props.image,
          typeNom: info?.nom ?? null,
          typeCouleur: info?.couleur ?? null,
          etatNom: etat?.nom ?? null,
          etatCouleur: etat?.couleur ?? null,
          etatDemoli: props.etat_conservation === ETAT_RUINE,
        })
        popup
          .setLngLat((f.geometry as unknown as { coordinates: [number, number] }).coordinates)
          .setDOMContent(contenu)
          .addTo(map)
      }
      function quitter() {
        map.getCanvas().style.cursor = ''
        popup.remove()
      }
      function ouvrirFiche(e: { features?: MapGeoJSONFeature[] }) {
        const slug = e.features?.[0]?.properties?.slug as string | undefined
        if (slug) routerRef.current.push(`/patrimoine/${slug}`)
      }

      for (const couche of ['points', 'eventail-points']) {
        map.on('mouseenter', couche, survoler)
        map.on('mouseleave', couche, quitter)
      }
      map.on('click', 'eventail-points', ouvrirFiche)
      map.on('click', 'points', (e) => {
        // Au-delà du dernier zoom d'amas, des points confondus s'empilent au
        // même pixel : le clic ouvrait la fiche du dessus, et les autres
        // restaient hors d'atteinte. La pile s'ouvre en éventail. Un même
        // point peut revenir deux fois (une par tuile) : dédoublonné par slug.
        const pile = [
          ...new globalThis.Map(
            map
              .queryRenderedFeatures(e.point, { layers: ['points'] })
              .map((f) => [f.properties.slug as string, f] as const),
          ).values(),
        ]
        if (pile.length > 1) {
          const centre = (pile[0].geometry as unknown as { coordinates: [number, number] }).coordinates
          ouvrirEventail(centre, pile, null)
          return
        }
        ouvrirFiche(e)
      })
      map.on('click', 'clusters', async (e) => {
        const f = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0]
        if (!f) return
        const id = f.properties.cluster_id as number
        const centre = (f.geometry as unknown as { coordinates: [number, number] }).coordinates
        // Un second clic sur l'amas ouvert le referme.
        if (eventail && eventail.amas === id) return fermerEventail()
        const src = map.getSource('patrimoine') as GeoJSONSource
        const zoom = await src.getClusterExpansionZoom(id)
        if (doitOuvrirEventail(zoom, DERNIER_ZOOM_AMAS)) {
          ouvrirEventail(centre, await src.getClusterLeaves(id, 100, 0), id)
          return
        }
        map.easeTo({ center: centre, zoom })
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

      setNombre(fc.features.length)
      setMapPret(true)
      ;(window as unknown as { __carteReady?: boolean }).__carteReady = true
    })

    }

    return () => {
      annule = true
      retirerClavier()
      // Avant `remove()` : une image d'animation en attente écrirait sinon
      // dans une carte détruite.
      fermerEventailRef.current()
      map?.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialisation unique au montage ; router/locale lus via refs, couleurExpression capturée par closure.
  }, [])

  // Bascule de la clé de lecture. Elle REPEINT la couche existante au lieu de
  // la reconstruire : les points, la source et le cadrage ne bougent pas, seule
  // la peinture change — c'est ce qui rend la comparaison entre les deux
  // lectures immédiate, l'œil gardant les mêmes repères d'une vue à l'autre.
  //
  // La peinture elle-même est dans `peinturePoints`, partagée avec l'éventail.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapPret || !map.getLayer('points')) return
    const peinture = peinturePoints(lecture === 'etat', couleurExpression, couleurEtatExpression)
    for (const couche of ['points', 'eventail-points']) {
      for (const [propriete, valeur] of Object.entries(peinture)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.setPaintProperty(couche, propriete as keyof typeof peinture, valeur as any)
      }
    }
  }, [lecture, mapPret, couleurEtatExpression, couleurExpression])

  // Re-fetch des points à chaque changement de filtres, une fois la carte prête.
  const premierRefetch = useRef(true)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapPret) return
    if (premierRefetch.current) {
      premierRefetch.current = false
      const vide =
        !filtres.type && !filtres.programme && !filtres.district && !filtres.epoque && !filtres.etat && !filtres.q
      if (vide) return // le handler load a déjà chargé le jeu non filtré
    }
    let annule = false
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(filtres)) if (v) qs.set(k, v)

    ;(async () => {
      let fc: { features: { geometry: { coordinates: [number, number] } }[] } = { features: [] }
      try {
        fc = await (await fetch(`/api/carte/points?${qs.toString()}`)).json()
      } catch {
        return
      }
      if (annule) return
      // Un éventail ouvert montrerait encore des points que le filtre retire.
      fermerEventailRef.current()
      const src = map.getSource('patrimoine') as GeoJSONSource | undefined
      src?.setData(fc as unknown as GeoJSON.FeatureCollection)
      setNombre(fc.features.length)
      const coords = fc.features.map((feat) => feat.geometry.coordinates)
      if (coords.length > 0) {
        const bounds = coords.reduce((b, c) => b.extend(c), new LngLatBounds(coords[0], coords[0]))
        map.fitBounds(bounds, { padding: 80, maxZoom: 11, duration: 300 })
      }
    })()

    return () => {
      annule = true
    }
  }, [filtres, mapPret])

  const majFiltre = (cle: string, valeur: string) => setFiltres((f) => ({ ...f, [cle]: valeur }))
  const majFiltreDebounce = useDebouncedCallback(majFiltre, 300)
  const onChangeFiltre = (cle: string, valeur: string) =>
    cle === 'q' ? majFiltreDebounce(cle, valeur) : majFiltre(cle, valeur)

  function basculerSatellite() {
    const map = mapRef.current
    if (!map) return
    const visible = !satellite
    map.setLayoutProperty('satellite', 'visibility', visible ? 'visible' : 'none')
    setSatellite(visible)
  }

  return (
    <div className="w-full">
      {/* Barre de filtres + compteur, HORS de la carte. Elle flottait
          auparavant par-dessus (`absolute … bg-white/95`) : elle masquait le
          haut du territoire, capturait les clics destinés à la carte, et son
          fond blanc EN DUR recevait un texte dont la couleur, elle, venait du
          thème (`--ink`, presque blanc en mode sombre) — libellés et champs
          étaient donc illisibles. Surface et texte viennent maintenant tous
          deux des mêmes jetons, donc le contraste tient dans les deux thèmes. */}
      <div
        className="flex flex-col gap-3 border-b px-[clamp(12px,3vw,32px)] py-4"
        style={{ background: 'var(--bg2)', color: 'var(--ink)', borderColor: 'var(--line)' }}
      >
        {/* Les six champs de filtre, dépliés, mesuraient 461 px sous 430 px de
            large et repoussaient la carte à y=625 — hors de l'écran d'un
            téléphone. La carte se dessinait pourtant très bien : personne ne
            la voyait, le visiteur n'ayant sous les yeux qu'un mur de listes
            déroulantes. Repliés derrière ce bouton, les filtres rendent la
            carte visible d'emblée là où elle est le sujet de la page, sans
            rien retirer à personne. Le bouton est `sm:hidden` : au-delà de
            640 px la barre n'a jamais posé problème et reste dépliée. */}
        <button
          type="button"
          onClick={() => setFiltresOuverts((o) => !o)}
          aria-expanded={filtresOuverts}
          aria-controls="filtres-carte"
          className="self-start rounded-xl border px-3 py-2 text-sm font-semibold sm:hidden"
          style={{ background: 'var(--bg)', color: 'var(--ink)', borderColor: 'var(--line)' }}
        >
          {filtresOuverts ? t('masquerFiltres') : t('filtres')}
        </button>

        <div
          id="filtres-carte"
          className={`${filtresOuverts ? 'flex' : 'hidden'} flex-wrap items-end gap-3 sm:flex`}
        >
          <FiltresCarte
            options={options}
            valeurs={{
              type: filtres.type,
              programme: filtres.programme,
              district: filtres.district,
              epoque: filtres.epoque,
              etat: filtres.etat,
            }}
            onChange={onChangeFiltre}
            locale={locale}
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {/* Bascule de la clé de lecture. Un groupe de deux boutons plutôt qu'un
              `<select>` de plus : ce n'est PAS un filtre — il ne retire aucun
              point — et le ranger parmi les filtres laisserait croire l'inverse.
              `aria-pressed` porte l'état, faute de quoi les deux boutons sont
              annoncés à l'identique quel que soit celui qui est actif. */}
          <div className="flex flex-col text-sm">
            <span className="mb-1 font-semibold">{t('lecture')}</span>
            <div
              role="group"
              aria-label={t('lecture')}
              className="flex overflow-hidden rounded-xl border"
              style={{ borderColor: 'var(--line)' }}
            >
              {([['type', t('parType')], ['etat', t('parEtat')]] as const).map(([cle, libelle]) => (
                <button
                  key={cle}
                  type="button"
                  data-testid={`lecture-${cle}`}
                  aria-pressed={lecture === cle}
                  onClick={() => setLecture(cle)}
                  className="px-3 py-2 text-sm font-semibold transition"
                  style={
                    lecture === cle
                      ? { background: 'var(--accent)', color: 'var(--surAccent)' }
                      : { background: 'var(--bg)', color: 'var(--ink)' }
                  }
                >
                  {libelle}
                </button>
              ))}
            </div>
          </div>

          <span data-testid="compteur-carte" className="pb-2 text-sm opacity-70">
            {t('compteur', { n: nombre })}
          </span>

          {/* L'heure du lieu (Radio Garden), rangée à droite : elle situe la
              carte, elle ne la filtre pas. */}
          <LigneHeure className="ml-auto pb-2 opacity-70" />
        </div>
      </div>

      <div className="relative h-[calc(100svh-17rem)] min-h-[420px] w-full">
        <div ref={conteneur} className="h-full w-full" />

        {/* Bascule Plan / Satellite */}
        <div className="absolute bottom-12 right-3 z-10 flex overflow-hidden rounded-full bg-white shadow">
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

        {/* Légende. Même défaut que la barre de filtres avant correction : le
            fond était blanc en dur et la couleur du texte venait du thème, donc
            les noms de types disparaissaient en mode sombre. Les deux viennent
            désormais des mêmes jetons. */}
        <section
          role="region"
          aria-label={t('legende')}
          className="absolute bottom-3 left-3 z-10 max-w-xs rounded-2xl p-4 shadow"
          style={{ background: 'color-mix(in oklab, var(--bg) 94%, transparent)', color: 'var(--ink)' }}
        >
          <h2 className="mb-2 font-serif text-sm" style={{ color: 'var(--ocre)' }}>
            {t('legende')}
          </h2>
          {/* La légende SUIT la clé de lecture : une légende des typologies
              affichée pendant que les points sont peints par état serait un
              contresens pur et simple. */}
          {lecture === 'type' ? (
            <ul className="grid grid-cols-1 gap-1 text-xs">
              {options.types.map((ty) => (
                <li key={ty.id} data-testid="legende-type" className="flex items-center gap-2">
                  {/* Pastille ET pictogramme : la couleur seule n'est pas une
                      légende pour qui la distingue mal. */}
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: ty.couleur ?? COULEUR_DEFAUT }}
                  />
                  <PictoType
                    type={ty.id}
                    taille={15}
                    className="shrink-0"
                    titre={nomType(ty)}
                  />
                  {nomType(ty)}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-1 gap-1 text-xs">
              {ETATS_CONSERVATION.map((e) => (
                <li key={e} data-testid="legende-etat" className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: COULEUR_ETAT[e], boxShadow: ombreEtat(e) }}
                  />
                  <span>{tEtat(e)}</span>
                </li>
              ))}
              {/* « Non renseigné » figure DANS la légende : sans lui, le
                  visiteur lirait ces points gris comme une sixième catégorie
                  inconnue — ou pire, comme des édifices en bon état. */}
              <li data-testid="legende-etat" className="flex items-center gap-2 opacity-70">
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: COULEUR_ETAT_INCONNU }}
                />
                {t('etatNonRenseigne')}
              </li>
            </ul>
          )}
        </section>

        {/* Inset « CI en Afrique », passé à GAUCHE : il était calé sous la
            barre de filtres flottante (`top-16`), et la barre partie, il
            recouvrait les commandes de zoom de MapLibre, ancrées en haut à
            droite. */}
        <div className="absolute left-3 top-3 hidden h-24 w-24 items-center justify-center rounded-lg bg-vert/90 text-[10px] font-semibold text-sable shadow sm:flex">
          CI · Afrique
        </div>
      </div>
    </div>
  )
}
