import { test, expect } from '@playwright/test'

test('l\'endpoint GeoJSON renvoie une FeatureCollection des publiés', async ({ request }) => {
  const res = await request.get('/api/carte/points')
  expect(res.ok()).toBe(true)
  const fc = await res.json()
  expect(fc.type).toBe('FeatureCollection')
  expect(fc.features.length).toBe(7)
  const f = fc.features[0]
  expect(f.geometry.type).toBe('Point')
  expect(Array.isArray(f.geometry.coordinates)).toBe(true)
  expect(f.properties.slug).toBeTruthy()
})

test('l\'endpoint filtre par type', async ({ request }) => {
  const res = await request.get('/api/carte/points?type=religieux')
  const fc = await res.json()
  expect(fc.features.every((f: { properties: { type_id: string } }) => f.properties.type_id === 'religieux')).toBe(true)
})
