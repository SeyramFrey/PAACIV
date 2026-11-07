import { test, expect } from '@playwright/test'

test("passer l'intro ne télécharge jamais la galerie", async ({ page }) => {
  const galerie: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('paaciv-galerie')) galerie.push(r.url())
  })
  await page.goto('/fr')
  await page.getByRole('button', { name: "Passer l'intro" }).click()
  await page.waitForTimeout(1500)
  expect(galerie).toEqual([])
})

test('le mode léger retire le film, et le choix est mémorisé', async ({ page }) => {
  await page.goto('/fr')
  await page.getByRole('button', { name: "Passer l'intro" }).click()
  await page.getByRole('button', { name: 'Activer le mode léger' }).click()
  await expect(page.getByRole('button', { name: 'Mode léger activé' })).toHaveAttribute('aria-pressed', 'true')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-leger', '')
  await expect(page.locator('html')).toHaveAttribute('data-intro', 'sans')
  await expect(page.locator('[data-intro-film]')).toHaveCount(0)
})
