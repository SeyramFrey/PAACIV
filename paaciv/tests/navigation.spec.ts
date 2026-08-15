import { test, expect } from '@playwright/test'

const ENTREES = [
  { libelle: 'La carte', url: '/fr/carte' },
  { libelle: "L'archive", url: '/fr/archives' },
  { libelle: 'Architectes', url: '/fr/architectes' },
  { libelle: 'Journal', url: '/fr/articles' },
  { libelle: 'Reportages', url: '/fr/reportages' },
  { libelle: 'Agenda', url: '/fr/evenements' },
]

test.describe('navigation de bureau', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  for (const e of ENTREES) {
    test(`« ${e.libelle} » mène à ${e.url}`, async ({ page }) => {
      await page.goto('/fr')
      await page.getByRole('navigation', { name: /principale/i }).getByRole('link', { name: e.libelle }).click()
      await expect(page).toHaveURL(new RegExp(`${e.url}$`))
    })
  }

  test('aucun lien mort ne subsiste dans l’en-tête et le pied de page', async ({ page }) => {
    await page.goto('/fr')
    const hrefs = await page.locator('header a, footer a').evaluateAll((as) =>
      as.map((a) => a.getAttribute('href') ?? ''),
    )
    for (const mort of ['/a-propos', '/contact', '/conditions-utilisation']) {
      expect(hrefs.some((h) => h.includes(mort)), mort).toBe(false)
    }
    expect(hrefs.some((h) => h === '#' || h === '')).toBe(false)
  })
})

test.describe('navigation mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('le menu s’ouvre, navigue et se ferme à Échap', async ({ page }) => {
    await page.goto('/fr')
    const panneau = page.getByRole('dialog', { name: /menu/i })
    await expect(panneau).toBeHidden()

    await page.getByRole('button', { name: /ouvrir le menu/i }).click()
    await expect(panneau).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(panneau).toBeHidden()

    await page.getByRole('button', { name: /ouvrir le menu/i }).click()
    await panneau.getByRole('link', { name: 'La carte' }).click()
    await expect(page).toHaveURL(/\/fr\/carte$/)
  })
})
