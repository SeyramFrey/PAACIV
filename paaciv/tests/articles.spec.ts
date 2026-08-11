import { test, expect } from '@playwright/test'

test('l\'index articles liste les publiés et masque les brouillons', async ({ page }) => {
  await page.goto('/fr/articles')
  await expect(page.getByRole('heading', { name: 'Articles', level: 1 })).toBeVisible()
  await expect(page.getByTestId('carte-article').first()).toBeVisible()
  await expect(page.getByText('BROUILLON', { exact: false })).toHaveCount(0)
})

test('le filtre par catégorie restreint réellement les résultats', async ({ page }) => {
  await page.goto('/fr/articles')
  const total = await page.getByTestId('carte-article').count()
  await page.goto('/fr/articles?categorie=histoires')
  const filtre = await page.getByTestId('carte-article').count()
  expect(filtre).toBeGreaterThan(0)
  expect(filtre).toBeLessThan(total)
})

test('la fiche article rend le corps riche et le patrimoine lié', async ({ page }) => {
  await page.goto('/fr/articles/pyramide-abidjan-histoire')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByTestId('patrimoine-lie')).toBeVisible()
})

test('un article brouillon renvoie 404', async ({ page }) => {
  const res = await page.goto('/fr/articles/article-brouillon')
  expect(res?.status()).toBe(404)
})

test('un filtre catégorie sans résultat affiche un message dédié, pas le message générique', async ({ page }) => {
  // Valeur de catégorie bidon : aucun seed nécessaire, aucun article ne peut
  // matcher. Le message générique « Aucun article pour le moment. » laisse
  // croire que le site entier est vide (constat de revue de branche finale).
  await page.goto('/fr/articles?categorie=inexistante-xyz')
  await expect(page.getByText('Aucun article dans cette catégorie.')).toBeVisible()
  await expect(page.getByText('Aucun article pour le moment.')).toHaveCount(0)
})
