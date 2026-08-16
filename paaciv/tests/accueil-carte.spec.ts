import { test, expect } from '@playwright/test'

// `ApercuCarte` (Task 12) n'est monté dans aucune page tant que la Task 14
// n'a pas assemblé `/fr` : ces deux specs échouent donc à coup sûr pour
// l'instant, ce n'est pas une régression. `test.fixme`, et non `test.skip` :
// Playwright les compte à part (« connu non fonctionnel »), la ligne de base
// « zéro échec » du dépôt reste donc un signal fiable pour les tâches
// suivantes. La Task 14 DOIT retirer ce `.fixme` une fois `ApercuCarte` et le
// lien « Ouvrir la carte » posés sur `/fr`.
test.fixme('le conteneur de carte de l’accueil est carré', async ({ page }) => {
  await page.goto('/fr')
  const carte = page.locator('.maplibregl-map').first()
  await carte.scrollIntoViewIfNeeded()
  await expect(carte).toBeVisible()
  const b = await carte.boundingBox()
  expect(b).not.toBeNull()
  // Tolérance d'un pixel : les arrondis sous-pixel du navigateur.
  expect(Math.abs(b!.width - b!.height)).toBeLessThanOrEqual(1)
})

test.fixme('« Ouvrir la carte » mène à la carte plein écran', async ({ page }) => {
  await page.goto('/fr')
  await page.getByRole('link', { name: /ouvrir la carte/i }).click()
  await expect(page).toHaveURL(/\/fr\/carte$/)
})
