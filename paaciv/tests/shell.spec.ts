import { test, expect } from '@playwright/test'

test('le header et le footer sont présents sur l\'accueil', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.getByRole('link', { name: 'PAACIV' })).toBeVisible()
  await expect(page.getByRole('navigation')).toContainText('Carte')
  await expect(page.getByRole('contentinfo')).toContainText('contact@paaciv.com')
  await expect(page.getByRole('contentinfo')).toContainText('LinkedIn')
})

test('la navigation expose les trois rubriques éditoriales', async ({ page }) => {
  await page.goto('/fr')
  const nav = page.getByRole('navigation').first()
  for (const [libelle, href] of [
    ['Articles', '/fr/articles'],
    ['Reportages', '/fr/reportages'],
    ['Événements', '/fr/evenements'],
  ] as const) {
    await expect(nav.getByRole('link', { name: libelle })).toHaveAttribute('href', href)
  }
})

test('aucun lien de navigation ne pointe vers /actualites', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.locator('a[href$="/actualites"]')).toHaveCount(0)
})
