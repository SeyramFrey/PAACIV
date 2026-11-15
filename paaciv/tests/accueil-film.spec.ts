import { test, expect, type Page } from '@playwright/test'

// Le film d'ouverture (components/accueil/IntroFilm.tsx).
//
// - Il couvre la page à la première arrivée sur l'accueil d'un onglet, mais
//   pas l'en-tête : le logo et le menu restent cliquables pendant le film
//   (choix de Sey du 13/11/2026).
// - « Passer l'intro » rend la page tout de suite, sans attendre le fondu de
//   0,9 s : le film qui s'efface ne retient plus les clics (correctif du
//   07/11/2026, repris le 15/11).
// - Il ne joue qu'une fois par onglet (lib/intro.ts).

/** Vrai si un clic au centre de l'élément l'atteindrait, sans les réessais de `click()`. */
function atteignable(page: Page, selecteur: string) {
  return page.evaluate((sel) => {
    const cible = document.querySelector<HTMLElement>(sel)
    if (!cible) return false
    const { left, top, width, height } = cible.getBoundingClientRect()
    const touche = document.elementFromPoint(left + width / 2, top + height / 2)
    return touche !== null && (touche === cible || cible.contains(touche))
  }, selecteur)
}

const LIEN_ENTETE = 'header a[href$="/villes"]'
const LIEN_HERO = '#top a[href$="/archives"]'

test.use({ viewport: { width: 1440, height: 900 } })

test('le film couvre la page mais pas l’en-tête, et rend la page dès qu’on le passe', async ({ page }) => {
  await page.goto('/fr')
  const film = page.locator('[data-intro-film]')
  await expect(film).toBeVisible()

  // Pendant le film : l'en-tête répond, le hero est dessous.
  await expect.poll(() => atteignable(page, LIEN_ENTETE)).toBe(true)
  expect(await atteignable(page, LIEN_HERO)).toBe(false)

  await page.getByRole('button', { name: "Passer l'intro" }).click()
  // Lu tout de suite, pendant le fondu : le film ne doit plus rien retenir.
  expect(await atteignable(page, LIEN_HERO)).toBe(true)

  await expect(film).toHaveCount(0)
  await page.locator(LIEN_HERO).click()
  await page.waitForURL('**/fr/archives')
})

test('le film ne rejoue pas dans le même onglet, mais dans un nouvel onglet', async ({ page, context }) => {
  await page.goto('/fr')
  await page.getByRole('button', { name: "Passer l'intro" }).click()
  await expect(page.locator('[data-intro-film]')).toHaveCount(0)

  await page.reload()
  await expect(page.locator('#top h1')).toBeVisible()
  await expect(page.locator('[data-intro-film]')).toHaveCount(0)

  const onglet = await context.newPage()
  await onglet.goto('/fr')
  await expect(onglet.locator('[data-intro-film]')).toBeVisible()
})
