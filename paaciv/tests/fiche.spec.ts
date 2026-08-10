import { test, expect } from '@playwright/test'

test('la fiche patrimoine affiche titre, type et galerie', async ({ page }) => {
  await page.goto('/fr/patrimoine/basilique-yamoussoukro')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Basilique')
  await expect(page.locator('img').first()).toBeVisible()
})

test('la fiche patrimoine affiche l\'architecte lié', async ({ page }) => {
  await page.goto('/fr/patrimoine/basilique-yamoussoukro')
  await expect(page.getByRole('heading', { name: 'Architectes' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Pierre Fakhoury' })).toBeVisible()
})

test('un brouillon renvoie 404 côté public', async ({ page }) => {
  const res = await page.goto('/fr/patrimoine/aeroport-felix-houphouet-boigny')
  expect(res?.status()).toBe(404)
})

test('métadonnées OpenGraph présentes', async ({ page }) => {
  await page.goto('/fr/patrimoine/hotel-ivoire-abidjan')
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Hôtel Ivoire/)
})
