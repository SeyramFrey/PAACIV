import { test, expect } from '@playwright/test'
import {
  listePointsCles, listeActivites, listeTemoignages,
  vedettesHero, chiffresCles, villesArchive, vignettesArchive,
} from '@/lib/data/accueil'
import { chargerTextes, texte } from '@/lib/data/contenu-site'

test('chargerTextes ramène les clés seedées', async () => {
  const t = await chargerTextes()
  expect(texte(t, 'hero_titre', 'fr')).toContain('tient debout')
  expect(texte(t, 'newsletter_titre', 'fr')).toBeTruthy()
})

test('listePointsCles sépare les deux blocs et exclut les brouillons', async () => {
  const pourquoi = await listePointsCles('pourquoi')
  const raisons = await listePointsCles('raisons')
  expect(pourquoi).toHaveLength(4)
  expect(raisons).toHaveLength(5)
  expect(raisons.some((r) => r.titre_fr === 'Raison en brouillon')).toBe(false)
})

test('listeActivites renvoie les quatre activités dans l’ordre', async () => {
  const a = await listeActivites()
  expect(a).toHaveLength(4)
  expect(a[0].titre_fr).toBe('Inventaire photographique')
  expect(a.every((x) => x.cta_href)).toBe(true)
})

test('listeTemoignages renvoie un tableau vide tant que rien n’est saisi', async () => {
  // Volontaire : aucun témoignage n'est seedé (spec §4.4). Le bloc doit
  // savoir ne pas s'afficher plutôt que d'inventer des paroles.
  expect(await listeTemoignages()).toEqual([])
})

test('vedettesHero ne renvoie que du publié avec une image', async () => {
  const v = await vedettesHero(5)
  expect(v.length).toBeGreaterThan(0)
  expect(v.length).toBeLessThanOrEqual(5)
  expect(v.every((x) => x.image !== null)).toBe(true)
  expect(v.some((x) => x.slug === 'aeroport-felix-houphouet-boigny')).toBe(false)
})

test('chiffresCles ne renvoie que des entiers positifs ou nuls', async () => {
  const c = await chiffresCles()
  for (const [k, n] of Object.entries(c)) {
    expect(Number.isInteger(n), k).toBe(true)
    expect(n, k).toBeGreaterThanOrEqual(0)
  }
  expect(c.fiches).toBeGreaterThan(0)
})

test('villesArchive dédoublonne et ignore les valeurs vides', async () => {
  const v = await villesArchive()
  expect(new Set(v).size).toBe(v.length)
  expect(v.every((x) => x.trim().length > 0)).toBe(true)
})

test('vignettesArchive porte le type pour les filtres', async () => {
  const g = await vignettesArchive(12)
  expect(g.length).toBeGreaterThan(0)
  expect(g.every((x) => x.image !== null)).toBe(true)
})
