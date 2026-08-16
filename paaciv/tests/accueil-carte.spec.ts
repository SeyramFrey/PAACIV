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

  // L'ASSERTION D'ABSENCE, sans laquelle le reste du test ne prouve que
  // « la carte finit par apparaître » — vrai avec ou sans montage paresseux.
  // `goto` attend l'événement `load`, donc l'hydratation a eu lieu et un
  // rendu inconditionnel de `<CarteApercu>` aurait déjà lancé le chargement
  // du chunk. La seconde assertion, après un délai borné, distingue « pas
  // encore monté » de « pas monté du tout » : c'est exactement la régression
  // visée — un garde d'intersection replacé DANS le module MapLibre laisserait
  // repartir les 785 Ko à chaque visite.
  const carte = page.locator('.maplibregl-map')
  await expect(carte).toHaveCount(0)
  await page.waitForTimeout(1500)
  await expect(carte).toHaveCount(0)

  const lienCarte = page.getByRole('link', { name: /ouvrir la carte/i })
  await lienCarte.scrollIntoViewIfNeeded()

  const premiere = carte.first()
  await expect(premiere).toBeVisible({ timeout: 10000 })
  const b = await premiere.boundingBox()
  expect(b).not.toBeNull()
  // Tolérance d'un pixel : les arrondis sous-pixel du navigateur.
  expect(Math.abs(b!.width - b!.height)).toBeLessThanOrEqual(1)
})

// `ssr: false` ne porte plus que sur le module MapLibre lui-même. Il portait
// auparavant sur toute la section, qui avait donc entièrement disparu du HTML
// servi par la page la plus visitée du site — titre, texte et surtout le lien
// interne vers `/carte`. Requête HTTP brute, sans navigateur : c'est bien le
// rendu serveur qui est mesuré, pas le résultat de l'hydratation.
test('la section carte est dans le HTML servi, sans exécution de JavaScript', async ({ request }) => {
  const html = await (await request.get('/fr')).text()
  expect(html).toContain('Ouvrir la carte')
  expect(html).toContain('href="/fr/carte"')
  // Contre-épreuve : le module MapLibre, lui, doit bien rester absent du HTML.
  expect(html).not.toContain('maplibregl-map')
})

test('« Ouvrir la carte » mène à la carte plein écran', async ({ page }) => {
  await page.goto('/fr')
  await page.getByRole('link', { name: /ouvrir la carte/i }).click()
  await expect(page).toHaveURL(/\/fr\/carte$/)
})
