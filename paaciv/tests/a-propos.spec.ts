import { test, expect } from '@playwright/test'

test('« À propos » est dans la navigation et mène à la page', async ({ page }) => {
  await page.goto('/fr')
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'À propos' }).click()
  await expect(page).toHaveURL(/\/fr\/a-propos$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

// La page se construit sur le contenu que l'association a DÉJÀ écrit : tant
// que `apropos_titre` porte son marqueur, elle reprend le titre de la page
// d'accueil. Elle n'est donc jamais vide — et le marqueur ne fuit jamais.
test('la page À propos n’expose aucun marqueur « À COMPLÉTER »', async ({ page }) => {
  await page.goto('/fr/a-propos')
  await expect(page.getByText(/À COMPLÉTER/)).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty()
})

test('la page À propos porte ses propres métadonnées', async ({ request }) => {
  const html = await (await request.get('/fr/a-propos')).text()
  expect(html).toContain('<title>À propos — PAACIV</title>')
  expect(html).toMatch(/<meta name="description"/)
})

test('le logo est présent sur la page et porte un nom accessible', async ({ page }) => {
  await page.goto('/fr/a-propos')
  await expect(page.getByRole('img', { name: 'PAACIV' }).first()).toBeVisible()
})
