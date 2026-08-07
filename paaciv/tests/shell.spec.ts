import { test, expect } from '@playwright/test'

test('le header et le footer sont présents sur l\'accueil', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.getByRole('link', { name: 'PAACIV' })).toBeVisible()
  await expect(page.getByRole('navigation')).toContainText('Carte')
  await expect(page.getByRole('contentinfo')).toContainText('contact@paaciv.com')
  await expect(page.getByRole('contentinfo')).toContainText('LinkedIn')
})
