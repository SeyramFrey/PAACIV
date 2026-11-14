import { test, expect } from '@playwright/test'

// Le carnet de visite (décision de Sey, 13/11/2026) : chaque fiche bâtiment
// ouverte pose un tampon dans le navigateur ; le compteur de l'en-tête et la
// page « Carnet » le montrent. Depuis le 14/11/2026, le carnet ne démarre
// qu'au clic « Commencer mon carnet de visite » : avant, rien n'est écrit. Chaque test part d'un navigateur neuf, donc d'un
// carnet vide : aucune donnée n'est écrite ailleurs que dans ce navigateur.

test('sans carnet commencé, une fiche ne tamponne rien et invite à commencer', async ({ page }) => {
  await page.goto('/fr/patrimoine/la-pyramide-abidjan')
  await expect(page.getByTestId('carnet-invitation')).toBeVisible()
  await expect(page.getByTestId('compteur-carnet')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('paaciv-carnet'))).toBeNull()
})

test('un carnet pas commencé ne montre pas de compteur et invite à le commencer', async ({ page }) => {
  await page.goto('/fr/carnet')
  await expect(page.getByRole('heading', { name: 'Mon carnet de visite' })).toBeVisible()
  await expect(page.getByTestId('carnet-non-commence')).toBeVisible()
  await page.getByRole('button', { name: 'Commencer mon carnet de visite' }).click()
  await expect(page.getByTestId('carnet-vide')).toBeVisible()
  await expect(page.getByTestId('compteur-carnet')).toHaveCount(0)
  // Page propre au visiteur : rien à indexer.
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
})

test('ouvrir des fiches pose des tampons, que le compteur et la page relisent', async ({ page }) => {
  await page.goto('/fr/patrimoine/la-pyramide-abidjan')
  // Commencer depuis une fiche la tamponne aussitôt.
  await page.getByRole('button', { name: 'Commencer mon carnet de visite' }).click()
  const compteur = page.getByTestId('compteur-carnet')
  await expect(compteur).toHaveText('Carnet · 1')
  await expect(page.getByTestId('carnet-marque')).toHaveText(/Dans votre carnet/)

  await page.goto('/fr/patrimoine/basilique-yamoussoukro')
  await expect(compteur).toHaveText('Carnet · 2')
  // Revenir sur une fiche déjà vue ne pose pas de second tampon.
  await page.goto('/fr/patrimoine/la-pyramide-abidjan')
  await expect(compteur).toHaveText('Carnet · 2')
  await expect(compteur).toHaveAttribute('aria-label', 'Mon carnet de visite : 2 lieux vus')

  await compteur.click()
  await page.waitForURL(/\/fr\/carnet$/)
  const tampons = page.getByTestId('carnet-tampons').getByRole('listitem')
  await expect(tampons).toHaveCount(2)
  // Dans l'ordre des visites.
  await expect(tampons.nth(0)).toContainText('La Pyramide')
  await expect(tampons.nth(1)).toContainText('Basilique')
  await expect(tampons.nth(0)).toContainText("heure d'Abidjan")
  await expect(page.getByText(/^2 lieux vus sur \d+\.$/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Adhérer' }).last()).toBeVisible()

  // La légende de l'éléphant marque les lieux déjà vus.
  await page.goto('/fr')
  await expect(page.getByTestId('carnet-pyramide')).toBeAttached()
  await expect(page.getByTestId('carnet-basilique')).toBeAttached()

  // Effacer, après confirmation, remet le carnet à zéro.
  await page.goto('/fr/carnet')
  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'Effacer et arrêter mon carnet' }).click()
  await expect(page.getByTestId('carnet-non-commence')).toBeVisible()
  await expect(page.getByTestId('compteur-carnet')).toHaveCount(0)
  // Arrêté : la fiche suivante ne pose plus rien.
  await page.goto('/fr/patrimoine/la-pyramide-abidjan')
  await expect(page.getByTestId('carnet-invitation')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('paaciv-carnet'))).toBeNull()
})

test('le carnet existe en anglais', async ({ page }) => {
  await page.goto('/en/patrimoine/la-pyramide-abidjan')
  await page.getByRole('button', { name: 'Start my visit notebook' }).click()
  await expect(page.getByTestId('compteur-carnet')).toHaveText('Notebook · 1')
  await page.goto('/en/carnet')
  await expect(page.getByRole('heading', { name: 'My visit notebook' })).toBeVisible()
  await expect(page.getByTestId('carnet-tampons')).toContainText('Abidjan time')
})

test('sur téléphone, le carnet passe de l’en-tête au menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/fr/patrimoine/la-pyramide-abidjan')
  await page.getByRole('button', { name: 'Commencer mon carnet de visite' }).click()
  await expect(page.getByTestId('carnet-marque')).toHaveText(/Dans votre carnet/)
  await expect(page.getByTestId('compteur-carnet')).toBeHidden()
  await page.getByRole('button', { name: 'Ouvrir le menu' }).click()
  const entree = page.getByTestId('menu-carnet')
  await expect(entree).toHaveText('Mon carnet de visite · 1')
  await entree.click()
  await page.waitForURL(/\/fr\/carnet$/)
  await expect(page.getByTestId('carnet-tampons').getByRole('listitem')).toHaveCount(1)
})
