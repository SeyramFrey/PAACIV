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

// Slug adapté par rapport au brief : dans le seed (Task 2 / migration
// 0013_editorial_seed.sql), l'article publié, le reportage publié et le
// piège « article-brouillon » sont tous liés à la-pyramide-abidjan (et non
// basilique-yamoussoukro).
test('la fiche patrimoine liste les contenus éditoriaux qui la citent', async ({ page }) => {
  await page.goto('/fr/patrimoine/la-pyramide-abidjan')
  const bloc = page.getByTestId('contenus-lies')
  await expect(bloc).toBeVisible()
  await expect(bloc.getByRole('link', { name: 'La Pyramide d\'Abidjan : histoire d\'un chef-d\'œuvre architectural' })).toBeVisible()
  await expect(bloc.getByRole('link', { name: /Immersion au cœur du patrimoine ivoirien/ })).toBeVisible()
  await expect(bloc.getByRole('link', { name: /BROUILLON/ })).toHaveCount(0) // l'article brouillon lié ne doit pas fuiter
})
