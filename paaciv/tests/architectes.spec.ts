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
  expect(noms).toHaveLength(ordreAttendu.length)
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

// La grille reprend la forme d'un trombinoscope d'agence : le portrait porte la
// vignette, le nom vient dessous, la fonction en dessous encore.
test('la grille des architectes montre portrait, nom et fonction', async ({ page }) => {
  await page.goto('/fr/architectes')
  const tuile = page.getByTestId('pastille-architecte').filter({ hasText: 'Adjo' }).first()

  // Le portrait est désaturé comme sur la fiche : le corpus mêle tirages
  // d'archive en noir et blanc et photographies récentes, et les aligner évite
  // qu'une grille ressemble à un patchwork.
  const photo = tuile.locator('img')
  await expect(photo).toHaveCSS('filter', /grayscale/)
  await expect(photo).toHaveCSS('object-fit', 'cover')

  // La fonction vient de `profession_*`, ajoutée par la migration 0032.
  await expect(tuile).toContainText('Architecte DESA · urbaniste')
})

test('un architecte sans photo rend ses initiales, pas un cadre vide', async ({ page }) => {
  await page.goto('/fr/architectes')
  const tuile = page.getByTestId('pastille-architecte').filter({ hasText: 'Pierre Fakhoury' })
  await expect(tuile.locator('img')).toHaveCount(0)
  await expect(tuile).toContainText('PF')
})
