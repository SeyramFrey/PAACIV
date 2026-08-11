import { test, expect } from '@playwright/test'
import { listeEvenements, getEvenementParSlug } from '@/lib/data/evenements'

test('listeEvenements ne renvoie que des publiés', async () => {
  const items = await listeEvenements()
  expect(items.length).toBeGreaterThan(0)
  expect(items.some((e) => e.slug === 'evenement-brouillon')).toBe(false)
})

test('le seed contient un événement à venir et un passé', async () => {
  const items = await listeEvenements()
  expect(items.some((e) => e.slug === 'exposition-a-venir')).toBe(true)
  expect(items.some((e) => e.slug === 'conference-passee')).toBe(true)
})

test('getEvenementParSlug : null pour un brouillon', async () => {
  expect(await getEvenementParSlug('evenement-brouillon')).toBeNull()
})
