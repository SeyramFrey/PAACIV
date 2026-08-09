import { test, expect } from '@playwright/test'

test('la page archives liste les patrimoines publiés', async ({ page }) => {
  await page.goto('/fr/archives')
  await expect(page.getByRole('heading', { name: 'Nos archives' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Basilique Notre-Dame/ })).toBeVisible()
})

test('le filtre par type restreint les résultats via l\'URL', async ({ page }) => {
  await page.goto('/fr/archives?type=religieux')
  await expect(page.getByRole('link', { name: /Basilique Notre-Dame/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /La Pyramide/ })).toHaveCount(0)
})
