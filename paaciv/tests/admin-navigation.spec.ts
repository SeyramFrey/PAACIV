import { test, expect, type Page } from '@playwright/test'

test.use({ storageState: 'playwright/.auth/admin.json' })

const RUBRIQUES = [
  ['/fr/admin', 'Tableau de bord'],
  ['/fr/admin/patrimoine', 'Patrimoine'],
  ['/fr/admin/architectes', 'Architectes'],
  ['/fr/admin/articles', 'Articles'],
  ['/fr/admin/reportages', 'Reportages'],
  ['/fr/admin/evenements', 'Événements'],
  ['/fr/admin/contenu', 'Contenu du site'],
  ['/fr/admin/medias', 'Photographies du site'],
  ['/fr/admin/points-cles', 'Points clés'],
  ['/fr/admin/activites', 'Activités'],
  ['/fr/admin/temoignages', 'Témoignages'],
  ['/fr/admin/demandes', 'Demandes'],
  ['/fr/admin/abonnes', 'Abonnés'],
] as const

const navigation = (page: Page) => page.getByRole('navigation', { name: "Navigation de l'administration" })

// `signOut()` révoque par défaut TOUTES les sessions du compte. Ce compte est
// partagé (exploitante, autres exécutions de la suite) : la requête est donc
// interceptée, et seul le parcours côté navigateur est exercé.
async function neutraliserDeconnexionServeur(page: Page) {
  await page.route('**/auth/v1/logout**', (route) => route.fulfill({ status: 204, body: '' }))
}

test.describe('ordinateur', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  for (const [chemin, libelle] of RUBRIQUES) {
    test(`${chemin} : la barre latérale indique « ${libelle} »`, async ({ page }) => {
      await page.goto(chemin)
      const nav = navigation(page)
      await expect(nav.getByRole('link', { name: libelle, exact: true })).toHaveAttribute('aria-current', 'page')
      await expect(nav.locator('[aria-current]')).toHaveCount(1)
      await expect(nav.getByRole('button', { name: 'Se déconnecter' })).toBeVisible()
      // Le déclencheur du format téléphone n'a rien à faire ici.
      await expect(nav.locator('button[aria-expanded]')).toBeHidden()
      const sansDebord = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      )
      expect(sansDebord).toBe(true)
    })
  }

  test('la rubrique reste signalée sur une fiche, et la barre reste sous la main', async ({ page }) => {
    await page.goto('/fr/admin/patrimoine/nouveau')
    const nav = navigation(page)
    await expect(nav.getByRole('link', { name: 'Patrimoine', exact: true })).toHaveAttribute('aria-current', 'true')
    await page.mouse.wheel(0, 900)
    await expect(nav.getByRole('link', { name: 'Architectes', exact: true })).toBeInViewport()
  })

  test('passe directement d’une rubrique à une autre', async ({ page }) => {
    await page.goto('/fr/admin/patrimoine')
    await navigation(page).getByRole('link', { name: 'Demandes', exact: true }).click()
    await expect(page).toHaveURL(/\/fr\/admin\/demandes$/)
    await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'Demandes' })).toBeVisible()
  })

  test('la déconnexion mène à la page de connexion', async ({ page }) => {
    await neutraliserDeconnexionServeur(page)
    await page.goto('/fr/admin/articles')
    await navigation(page).getByRole('button', { name: 'Se déconnecter' }).click()
    await expect(page).toHaveURL(/\/fr\/login/)
  })

  test('la barre est traduite en anglais', async ({ page }) => {
    await page.goto('/en/admin/patrimoine')
    const nav = page.getByRole('navigation', { name: 'Administration menu' })
    await expect(nav.getByText('Inventory')).toBeVisible()
    await expect(nav.getByRole('button', { name: 'Sign out' })).toBeVisible()
  })
})

test.describe('téléphone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('le menu se replie, ouvre la rubrique choisie et se referme', async ({ page }) => {
    await page.goto('/fr/admin/patrimoine')
    const nav = navigation(page)
    const declencheur = nav.locator('button[aria-expanded]')
    const lien = nav.getByRole('link', { name: 'Demandes', exact: true })

    await expect(declencheur).toContainText('Patrimoine')
    await expect(declencheur).toHaveAttribute('aria-expanded', 'false')
    await expect(lien).toBeHidden()

    await declencheur.click()
    await expect(declencheur).toHaveAttribute('aria-expanded', 'true')
    await expect(nav.getByRole('button', { name: 'Se déconnecter' })).toBeVisible()

    await lien.click()
    await expect(page).toHaveURL(/\/fr\/admin\/demandes$/)
    await expect(declencheur).toHaveAttribute('aria-expanded', 'false')
    await expect(declencheur).toContainText('Demandes')
  })

  test('Échap referme le menu et rend le focus au déclencheur', async ({ page }) => {
    await page.goto('/fr/admin')
    const declencheur = navigation(page).locator('button[aria-expanded]')
    await declencheur.click()
    await page.keyboard.press('Escape')
    await expect(declencheur).toHaveAttribute('aria-expanded', 'false')
    await expect(declencheur).toBeFocused()
  })

  test('toucher hors du panneau le referme', async ({ page }) => {
    await page.goto('/fr/admin')
    const declencheur = navigation(page).locator('button[aria-expanded]')
    await declencheur.click()
    // L'en-tête du site reste découvert au-dessus du panneau.
    await page.mouse.click(195, 40)
    await expect(declencheur).toHaveAttribute('aria-expanded', 'false')
  })

  test('toutes les rubriques restent atteignables, déconnexion comprise', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 560 })
    await page.goto('/fr/admin')
    const nav = navigation(page)
    await nav.locator('button[aria-expanded]').click()
    // Sur écran court, la déconnexion reste visible sans faire défiler la liste.
    await expect(nav.getByRole('button', { name: 'Se déconnecter' })).toBeInViewport()
    const dernier = nav.getByRole('link', { name: 'Abonnés', exact: true })
    await dernier.scrollIntoViewIfNeeded()
    await expect(dernier).toBeInViewport()
  })
})
