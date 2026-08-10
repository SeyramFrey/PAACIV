import { test, expect } from '@playwright/test'
import { listeArchitectes, getArchitecteParSlug } from '@/lib/data/architectes'

test('listeArchitectes ne renvoie que des publiés, avec origine', async () => {
  const items = await listeArchitectes()
  expect(items.length).toBeGreaterThan(0)
  expect(items.every((a) => a.origine === 'ivoirien' || a.origine === 'etranger')).toBe(true)
  expect(items.some((a) => a.slug === 'architecte-brouillon')).toBe(false)
})

test('getArchitecteParSlug renvoie le détail + réalisations liées publiées', async () => {
  const a = await getArchitecteParSlug('pierre-fakhoury')
  expect(a).not.toBeNull()
  expect(a!.nom).toBe('Pierre Fakhoury')
  // Le seed (0010) lie pierre-fakhoury (publié) à basilique-yamoussoukro (publié) :
  // la réalisation doit apparaître, et seulement celle-ci (pas de fuite de lien brouillon).
  expect(a!.realisations.length).toBeGreaterThan(0)
  expect(a!.realisations.every((r) => r.slug === 'basilique-yamoussoukro')).toBe(true)
})

test('getArchitecteParSlug renvoie null pour un slug inexistant', async () => {
  expect(await getArchitecteParSlug('nexiste-pas')).toBeNull()
})
