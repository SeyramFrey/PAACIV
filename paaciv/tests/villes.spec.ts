import { test, expect } from '@playwright/test'

// Les communes n'étaient qu'une valeur de filtre. Ce sont désormais des pages,
// pour deux raisons distinctes : la profondeur éditoriale (un texte, une carte,
// une chronologie propres au lieu) et le référencement — « patrimoine
// Grand-Bassam » est une requête que les gens tapent, et un filtre n'a ni URL
// stable, ni titre, ni description.
//
// Les assertions s'ancrent sur Grand-Bassam, présente dans le corpus stable et
// nommée avec un trait d'union — c'est justement le cas qui met le slug à
// l'épreuve.

test('l’index des villes liste les communes du corpus avec leur compte', async ({ page }) => {
  await page.goto('/fr/villes')
  await expect(page.getByRole('heading', { name: 'Les villes', level: 1 })).toBeVisible()
  const lien = page.getByRole('link', { name: /Grand-Bassam/ })
  await expect(lien).toBeVisible()
  await expect(lien).toHaveAttribute('href', '/fr/villes/grand-bassam')
  await expect(lien).toContainText(/ÉDIFICE\(S\) DOCUMENTÉ\(S\)/i)
})

test('la page d’une commune porte un titre écrit pour la recherche', async ({ page }) => {
  await page.goto('/fr/villes/grand-bassam')
  await expect(page).toHaveTitle('Patrimoine de Grand-Bassam — PAACIV')
  await expect(
    page.getByRole('heading', { name: 'Patrimoine de Grand-Bassam', level: 1 }),
  ).toBeVisible()
  const description = page.locator('meta[name="description"]')
  await expect(description).toHaveAttribute('content', /Grand-Bassam/)
})

test('la page d’une commune montre ses fiches, sa chronologie et son extrait de carte', async ({
  page,
}) => {
  await page.goto('/fr/villes/grand-bassam')
  await expect(
    page.getByTestId('grille-patrimoine').getByRole('link', { name: /Quartier France/ }),
  ).toBeVisible()
  await expect(page.getByTestId('frise')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sur la carte' })).toBeVisible()
})

// Le slug est dérivé du nom, il n'existe aucune table de communes : une valeur
// inconnue doit donc rendre un 404 franc, et non une page vide qui laisserait
// croire à une commune sans édifice.
test('un slug de commune inconnu rend un 404', async ({ page }) => {
  const reponse = await page.goto('/fr/villes/commune-qui-nexiste-pas')
  expect(reponse?.status()).toBe(404)
})

// Aller-retour complet : la fiche renvoie vers sa commune, la commune ramène à
// la fiche. C'est ce qui fait de /villes une entrée dans le corpus plutôt qu'une
// impasse.
test('une fiche renvoie vers la page de sa commune, et retour', async ({ page }) => {
  await page.goto('/fr/patrimoine/quartier-france-de-grand-bassam')
  await page.getByRole('link', { name: 'Grand-Bassam', exact: true }).click()
  await page.waitForURL('**/fr/villes/grand-bassam')
  await page
    .getByTestId('grille-patrimoine')
    .getByRole('link', { name: /Quartier France/ })
    .click()
  await page.waitForURL('**/fr/patrimoine/quartier-france-de-grand-bassam')
})

test('l’en-tête mène aux villes', async ({ page }) => {
  await page.goto('/fr')
  await page.getByRole('navigation', { name: 'Navigation principale' })
    .getByRole('link', { name: 'Villes' })
    .click()
  await page.waitForURL('**/fr/villes')
})
