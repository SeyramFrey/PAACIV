import { test, expect } from '@playwright/test'

test('le site s’ouvre en mode sombre par défaut', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('la bascule passe en clair et la préférence survit au rechargement', async ({ page }) => {
  await page.goto('/fr')
  await page.getByRole('button', { name: /thème|theme/i }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})
