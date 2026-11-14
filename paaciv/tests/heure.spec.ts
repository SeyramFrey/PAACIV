import { test, expect } from '@playwright/test'

// La ligne d'heure « Plateau, Abidjan · 16 h 20 » (moodboard du 13/11/2026,
// Radio Garden). L'horloge du navigateur est figée : le test ne dépend ni de
// l'heure ni du fuseau de la machine.

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-14T16:20:30.000Z') })
  // Le film d'ouverture ne concerne pas ce test.
  await page.addInitScript(() => sessionStorage.setItem('paaciv-intro-vue', 'oui'))
})

test("l'heure d'Abidjan s'affiche sous l'éléphant, et passe à la minute suivante", async ({ page }) => {
  await page.goto('/fr')
  const ligne = page.locator('#embleme').getByTestId('ligne-heure')
  await expect(ligne).toContainText('Plateau, Abidjan')
  await expect(ligne.locator('time')).toHaveText('16 h 20')
  await expect(ligne.locator('time')).toHaveAttribute('datetime', '16:20')
  // Lue comme une phrase, sans zone qui parle d'elle-même chaque minute.
  await expect(ligne.locator('.sr-only')).toHaveText('Heure locale au Plateau, à Abidjan : 16 h 20')
  await expect(ligne).not.toHaveAttribute('aria-live', /.+/)

  await page.clock.runFor(30_000)
  await expect(ligne.locator('time')).toHaveText('16 h 21')
})

test("la carte porte la même heure, au format anglais en anglais", async ({ page }) => {
  await page.goto('/en/carte')
  const ligne = page.getByTestId('ligne-heure')
  await expect(ligne.locator('time')).toHaveText('16:20')
  await expect(ligne.locator('.sr-only')).toHaveText('Local time in Plateau, Abidjan: 16:20')
})
