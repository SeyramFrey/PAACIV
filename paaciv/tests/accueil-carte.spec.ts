import { test, expect } from '@playwright/test'

// `ApercuCarte` (Task 12) est désormais montée sur `/fr` par la Task 14.
test('le conteneur de carte de l’accueil est carré', async ({ page }) => {
  await page.goto('/fr')
  const carte = page.locator('.maplibregl-map').first()
  await carte.scrollIntoViewIfNeeded()
  await expect(carte).toBeVisible()
  const b = await carte.boundingBox()
  expect(b).not.toBeNull()
  // Tolérance d'un pixel : les arrondis sous-pixel du navigateur.
  expect(Math.abs(b!.width - b!.height)).toBeLessThanOrEqual(1)
})

test('« Ouvrir la carte » mène à la carte plein écran', async ({ page }) => {
  await page.goto('/fr')
  await page.getByRole('link', { name: /ouvrir la carte/i }).click()
  await expect(page).toHaveURL(/\/fr\/carte$/)
})
