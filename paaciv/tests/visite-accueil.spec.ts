import { test, expect, type Page } from '@playwright/test'

// L'accueil comme une visite (décision de Sey du 14/11/2026) : six étapes,
// Entrée · Sommaire · Carte · Les lieux · Archives · Votre carnet, chacune
// avec son surtitre numéroté ; un rail qui suit le visiteur (colonne à gauche
// en grand écran, barre en bas d'écran ailleurs) ; puis l'épilogue « La vie
// de l'association ». Aucune écriture hors du navigateur de test.

test.beforeEach(async ({ page }) => {
  // Le film d'ouverture a déjà été vu : la page s'ouvre sur le haut de page.
  await page.addInitScript(() => sessionStorage.setItem('paaciv-intro-vue', 'oui'))
})

// Place le milieu de l'écran dans une étape, comme le ferait un défilement.
// Après l'hydratation, la section de l'éléphant peut encore changer de
// hauteur (démontage épinglé) : on recommence tant que l'étape visée n'est pas
// celle que le rail annonce.
async function allerA(page: Page, zone: string) {
  await expect(async () => {
    await page.evaluate((id) => {
      const el = document.getElementById(id)!
      const haut = el.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: haut + Math.min(el.offsetHeight / 2, 200) - window.innerHeight / 2, behavior: 'instant' })
    }, zone)
    await expect(page.getByTestId('rail-visite')).toHaveAttribute('data-zone', zone, { timeout: 1000 })
    // Et l'étape tient : aucune section au-dessus n'a encore grandi.
    await page.waitForTimeout(500)
    await expect(page.getByTestId('rail-visite')).toHaveAttribute('data-zone', zone, { timeout: 100 })
  }).toPass({ timeout: 15_000 })
}

test('les étapes se suivent dans l’ordre décidé, avec leurs surtitres numérotés', async ({ page }) => {
  await page.goto('/fr')
  const zones = await page.locator('[data-etape]').evaluateAll((els) => els.map((e) => e.getAttribute('data-etape')))
  expect(zones).toEqual(['entree', 'sommaire', 'carte', 'lieux', 'archives', 'carnet', 'epilogue'])

  await expect(page.locator('#sommaire')).toContainText('02 · Sommaire')
  await expect(page.locator('#carte')).toContainText('03 · Carte')
  await expect(page.locator('#lieux')).toContainText('04 · Les lieux')
  await expect(page.locator('#archives')).toContainText('05 · Archives')
  await expect(page.locator('#carnet')).toContainText('06 · Votre carnet')
  await expect(page.locator('#epilogue').getByRole('heading', { name: "La vie de l'association" })).toBeVisible()
  // L'épilogue garde l'agenda, le journal et l'adhésion.
  await expect(page.locator('#epilogue #agenda')).toBeAttached()
  await expect(page.locator('#epilogue #journal')).toBeAttached()
  await expect(page.locator('#epilogue #adherer')).toBeAttached()
})

test('en anglais, les étapes ont leurs noms anglais', async ({ page }) => {
  await page.goto('/en')
  await expect(page.locator('#carte')).toContainText('03 · Map')
  await expect(page.locator('#carnet')).toContainText('06 · Your notebook')
})

test.describe('grand écran', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('le rail suit la visite, se cache sur l’entrée et dans l’épilogue', async ({ page }) => {
    await page.goto('/fr')
    const rail = page.getByTestId('rail-visite')
    await expect(rail).toBeVisible()
    // Sur l'entrée, le rail est là mais éteint et hors d'atteinte.
    await expect(rail).toHaveAttribute('data-zone', 'entree')
    expect(await rail.evaluate((n) => (n as HTMLElement).inert)).toBe(true)
    await expect(page.getByTestId('barre-visite')).toBeHidden()

    await allerA(page, 'carte')
    await expect(rail).toHaveAttribute('data-zone', 'carte')
    expect(await rail.evaluate((n) => (n as HTMLElement).inert)).toBe(false)
    await expect(rail.locator('[aria-current="step"]')).toContainText('03')
    const nomCourant = page.getByTestId('rail-nom-courant')
    // Le nom de l'étape se replie après son arrivée, pour ne pas rester sur le texte…
    await expect(nomCourant).toHaveCSS('opacity', '0', { timeout: 5000 })
    // … et se déplie au survol du rail.
    await rail.hover()
    await expect(nomCourant).toHaveCSS('opacity', '1')
    await page.mouse.move(720, 450)
    await expect(nomCourant).toHaveCSS('opacity', '0')

    // Un numéro du rail mène à son étape, dont le nom se déplie à l'arrivée.
    await rail.getByRole('link', { name: /05/ }).click()
    await expect(page).toHaveURL(/#archives$/)
    // Sans survol ni focus, qui déplieraient tous les noms.
    await page.mouse.move(720, 450)
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await expect(nomCourant).toHaveCSS('opacity', '1')

    await allerA(page, 'epilogue')
    await expect(rail).toHaveAttribute('data-zone', 'epilogue')
    expect(await rail.evaluate((n) => (n as HTMLElement).inert)).toBe(true)
  })
})

test.describe('téléphone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('la barre dit où on en est et déplie les étapes', async ({ page }) => {
    await page.goto('/fr')
    const barre = page.getByTestId('barre-visite')
    await expect(page.getByTestId('rail-visite')).toBeHidden()

    await allerA(page, 'carte')
    await expect(page.getByTestId('barre-position')).toHaveText('3/6 · Carte')
    const bouton = barre.getByRole('button')
    await expect(bouton).toHaveAccessibleName('Étape 3 sur 6 : Carte')
    await bouton.click()
    await expect(bouton).toHaveAttribute('aria-expanded', 'true')
    await barre.getByRole('link', { name: /Les lieux/ }).click()
    await expect(page).toHaveURL(/#lieux$/)
    await expect(bouton).toHaveAttribute('aria-expanded', 'false')
  })
})

test('l’étape carnet invite à commencer, sans rien écrire avant le clic', async ({ page }) => {
  await page.goto('/fr')
  const etape = page.getByTestId('etape-carnet')
  await expect(etape.getByTestId('etape-carnet-invitation')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('paaciv-carnet'))).toBeNull()

  await etape.getByRole('button', { name: 'Commencer mon carnet de visite' }).click()
  await expect(etape.getByTestId('etape-carnet-vide')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('paaciv-carnet'))).toBe('[]')
})

test('l’étape carnet montre le compte et les derniers tampons, du plus récent au plus ancien', async ({ page }) => {
  await page.goto('/fr/patrimoine/la-pyramide-abidjan')
  await page.getByRole('button', { name: 'Commencer mon carnet de visite' }).click()
  await expect(page.getByTestId('carnet-marque')).toHaveText(/Dans votre carnet/)
  await page.goto('/fr/patrimoine/basilique-yamoussoukro')
  await expect(page.getByTestId('carnet-marque')).toHaveText(/Dans votre carnet/)

  await page.goto('/fr')
  const etape = page.getByTestId('etape-carnet')
  await expect(etape.getByTestId('etape-carnet-compte')).toHaveText('2 lieux tamponnés')
  const tampons = etape.getByRole('listitem')
  await expect(tampons).toHaveCount(2)
  await expect(tampons.nth(0)).toContainText('Basilique')
  await expect(tampons.nth(1)).toContainText('La Pyramide')
  await expect(tampons.nth(0)).toContainText("heure d'Abidjan")
  await etape.getByRole('link', { name: 'Voir tout mon carnet' }).click()
  await page.waitForURL(/\/fr\/carnet$/)
})

test.describe('mouvement réduit', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' }, viewport: { width: 1440, height: 900 } })

  test('le rail fonctionne sans transition', async ({ page }) => {
    await page.goto('/fr')
    await allerA(page, 'lieux')
    const rail = page.getByTestId('rail-visite')
    await expect(rail).toHaveAttribute('data-zone', 'lieux')
    // Aucune durée de transition : le rail apparaît d'un coup.
    expect(await rail.evaluate((n) => getComputedStyle(n).transitionDuration)).toBe('0s')
  })
})
