import { test, expect } from '@playwright/test'

test('la page architectes affiche les sections ivoiriens et étrangers', async ({ page }) => {
  await page.goto('/fr/architectes')
  await expect(page.getByRole('heading', { name: 'Architectes' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Ivoiriens' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Étrangers' })).toBeVisible()
  // au moins une pastille menant vers une fiche
  await expect(page.getByTestId('pastille-architecte').first()).toBeVisible()
})

test('la grille des architectes ivoiriens est triée par année de naissance croissante', async ({
  page,
}) => {
  await page.goto('/fr/architectes')
  const region = page.getByRole('region', { name: 'Ivoiriens' })
  const noms = await region.getByTestId('pastille-architecte').allTextContents()
  // Ordre attendu d'après le seed (années de naissance) : Aka Adjo (1935),
  // Michel Goly Kouassi (1940), Pierre Fakhoury (1943), Jean Léon (1955).
  const ordreAttendu = ['Aka Adjo', 'Michel Goly Kouassi', 'Pierre Fakhoury', 'Jean Léon']
  const ordreObtenu = ordreAttendu.filter((nomAttendu) =>
    noms.some((texte) => texte.includes(nomAttendu)),
  )
  expect(ordreObtenu).toEqual(ordreAttendu)
  for (const [i, nomAttendu] of ordreAttendu.entries()) {
    expect(noms[i]).toContain(nomAttendu)
  }
})

test('un architecte au statut brouillon n\'apparaît pas sur la page publique', async ({
  page,
}) => {
  await page.goto('/fr/architectes')
  await expect(page.getByText('Amara Koffi')).toHaveCount(0)
})
