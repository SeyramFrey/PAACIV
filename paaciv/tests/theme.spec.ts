import { test, expect } from '@playwright/test'

test('le site s’ouvre en plein jour par défaut', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

// Hors accueil : le film d'ouverture recouvre la bascule tant qu'il joue.
test('la bascule passe en nuit et la préférence survit au rechargement', async ({ page }) => {
  await page.goto('/fr/architectes')
  await page.getByRole('button', { name: /thème|theme/i }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})
