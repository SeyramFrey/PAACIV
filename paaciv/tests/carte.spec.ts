import { test, expect } from '@playwright/test'

test('la page carte affiche la légende et la bascule Plan/Satellite', async ({ page }) => {
  await page.goto('/fr/carte')
  await expect(page.getByRole('heading', { name: 'Carte du patrimoine' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Satellite' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Légende' })).toBeVisible()
  // 7 types dans la légende
  await expect(page.getByTestId('legende-type')).toHaveCount(7)
})

// La carte était rendue correctement sur mobile, mais personne ne la voyait :
// la barre de filtres, dépliée en six rangées sous 430 px, mesurait à elle
// seule 461 px et repoussait la toile à y=625 — hors de l'écran d'un
// iPhone 13 (664 px utiles). Le symptôme rapporté (« la carte n'apparaît
// pas ») était donc un défaut de mise en page, pas de rendu : c'est bien la
// VISIBILITÉ sans défilement qu'il faut tenir, pas la seule présence.
test.describe('carte sur petit écran', () => {
  test.use({ viewport: { width: 390, height: 664 } })

  test('la carte est visible sans défiler', async ({ page }) => {
    await page.goto('/fr/carte')
    await page.waitForFunction(() => (window as unknown as { __carteReady?: boolean }).__carteReady === true)
    await expect(page.locator('.maplibregl-canvas')).toBeInViewport({ ratio: 0.3 })
  })

  test('les filtres restent atteignables, repliés derrière un bouton', async ({ page }) => {
    await page.goto('/fr/carte')
    // `exact: true` : sans lui, le repli de next-intl sur la clé manquante
    // (« carte.filtres ») CONTIENT « Filtres » et le test passait au vert
    // alors que le visiteur lisait la clé brute.
    const bouton = page.getByRole('button', { name: 'Filtres', exact: true })
    await expect(bouton).toBeVisible()
    await expect(page.getByLabel('Type')).toBeHidden()
    await bouton.click()
    await expect(page.getByLabel('Type')).toBeVisible()
  })
})
