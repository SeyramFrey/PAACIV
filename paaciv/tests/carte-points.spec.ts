import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// L'API de la carte rend EXACTEMENT les fiches publiées qui ont des
// coordonnées. Le test comparait à un nombre écrit en dur (7), faux dès que
// l'association publiait une fiche de plus : la référence est maintenant la
// base elle-même, lue comme un visiteur (clé anonyme, RLS : publiés seuls).
test('l\'endpoint GeoJSON renvoie une FeatureCollection des publiés', async ({ request }) => {
  const res = await request.get('/api/carte/points')
  expect(res.ok()).toBe(true)
  const fc = await res.json()
  expect(fc.type).toBe('FeatureCollection')

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data, error } = await db
    .from('patrimoine')
    .select('slug, lat, lng')
    .eq('statut', 'publie')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
  expect(error).toBeNull()
  expect(data!.length).toBeGreaterThan(0)

  // Mêmes fiches, ni plus ni moins : une fiche publiée sans coordonnées n'a
  // pas de point, un brouillon non plus.
  const points = fc.features as { geometry: { type: string; coordinates: number[] }; properties: { slug: string } }[]
  expect(points.map((f) => f.properties.slug).sort()).toEqual(data!.map((p) => p.slug).sort())

  // Et chaque point est à sa place : GeoJSON écrit [longitude, latitude].
  const parSlug = new Map(data!.map((p) => [p.slug, [p.lng, p.lat]]))
  for (const f of points) {
    expect(f.geometry.type).toBe('Point')
    expect(f.geometry.coordinates).toEqual(parSlug.get(f.properties.slug))
  }
})

test('l\'endpoint filtre par type', async ({ request }) => {
  const res = await request.get('/api/carte/points?type=religieux')
  const fc = await res.json()
  expect(fc.features.every((f: { properties: { type_id: string } }) => f.properties.type_id === 'religieux')).toBe(true)
})
