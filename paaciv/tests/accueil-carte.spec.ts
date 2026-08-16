import { test, expect } from '@playwright/test'

// `ApercuCarte` (Task 12) est désormais montée sur `/fr` par la Task 14.
//
// La carte se monte désormais seulement à l'intersection avec le viewport
// (revue finale, point D1) : `.maplibregl-map` n'existe pas tant que rien n'a
// scrollé jusqu'à elle, donc on ne peut plus faire défiler DIRECTEMENT vers
// ce noeud — il n'existe pas encore au moment où `scrollIntoViewIfNeeded()`
// en aurait besoin. On défile vers un élément STABLE de la même section, qui
// existe indépendamment de MapLibre (le lien « Ouvrir la carte », rendu par
// le Composant Serveur, présent dès le premier rendu), puis on attend
// l'apparition de la carte avec un délai borné. Cette attente est le test :
// si le montage paresseux casse un jour (l'IntersectionObserver ne se
// déclenche jamais, ou la carte ne s'initialise plus), ce test échoue ici au
// lieu de rester bloqué indéfiniment sur un élément qui n'apparaît jamais —
// l'ancienne version, qui defilait vers `.maplibregl-map` directement, ne
// pouvait pas distinguer « la carte se monte lentement » de « la carte ne se
// montera jamais », puisqu'elle supposait le montage déjà fait.
test('le conteneur de carte de l’accueil est carré, montée seulement au défilement', async ({ page }) => {
  await page.goto('/fr')
  const lienCarte = page.getByRole('link', { name: /ouvrir la carte/i })
  await lienCarte.scrollIntoViewIfNeeded()

  const carte = page.locator('.maplibregl-map').first()
  await expect(carte).toBeVisible({ timeout: 10000 })
  const b = await carte.boundingBox()
  expect(b).not.toBeNull()
  // Tolérance d'un pixel : les arrondis sous-pixel du navigateur.
  expect(Math.abs(b!.width - b!.height)).toBeLessThanOrEqual(1)
})

test('« Ouvrir la carte » mène à la carte plein écran', async ({ page }) => {
  await page.goto('/fr')
  await page.getByRole('link', { name: /ouvrir la carte/i }).click()
  await expect(page).toHaveURL(/\/fr\/carte$/)
})
