import { test, expect } from '@playwright/test'

test('la page carte affiche la légende et la bascule Plan/Satellite', async ({ page }) => {
  await page.goto('/fr/carte')
  await expect(page.getByRole('heading', { name: 'Carte du patrimoine' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Satellite' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Légende' })).toBeVisible()
  // 7 types dans la légende
  await expect(page.getByTestId('legende-type')).toHaveCount(7)
})
