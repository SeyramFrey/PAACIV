import { test, expect } from '@playwright/test'
import { listePatrimoine, getPatrimoineParSlug, pointsPublies } from '@/lib/data/patrimoine'

test('listePatrimoine renvoie les publiés et filtre par type', async () => {
  const tous = await listePatrimoine()
  expect(tous.length).toBe(7)
  const religieux = await listePatrimoine({ type: 'religieux' })
  expect(religieux.length).toBeGreaterThanOrEqual(2)
  expect(religieux.every((p) => p.type_id === 'religieux')).toBe(true)
})

test('listePatrimoine cherche par texte', async () => {
  const r = await listePatrimoine({ q: 'pyramide' })
  expect(r.map((p) => p.slug)).toContain('la-pyramide-abidjan')
})

test('getPatrimoineParSlug renvoie le détail joint', async () => {
  const p = await getPatrimoineParSlug('basilique-yamoussoukro')
  expect(p).not.toBeNull()
  expect(p!.type?.id).toBe('religieux')
  expect(p!.images.length).toBeGreaterThanOrEqual(1)
})

test('getPatrimoineParSlug renvoie null pour un brouillon (public)', async () => {
  const p = await getPatrimoineParSlug('aeroport-felix-houphouet-boigny')
  expect(p).toBeNull()
})

test('pointsPublies renvoie des points avec coordonnées', async () => {
  const pts = await pointsPublies()
  expect(pts.length).toBe(7)
  expect(pts.every((p) => typeof p.lat === 'number' && typeof p.lng === 'number')).toBe(true)
})
