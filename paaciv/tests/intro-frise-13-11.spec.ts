import { test, expect } from '@playwright/test'

// Retours de Sey du 13/11/2026 sur l'accueil et l'archive.

test.describe('film d’intro', () => {
  test('le menu reste cliquable pendant le film', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/fr')
    await expect(page.locator('[data-intro-film]')).toBeVisible()
    await page.getByRole('navigation', { name: /principale/i }).getByRole('link', { name: 'La carte' }).click()
    await expect(page).toHaveURL(/\/fr\/carte$/)
  })

  test('il ne joue qu’une fois par onglet : une actualisation ne le relance pas', async ({ page, context }) => {
    await page.goto('/fr')
    await expect(page.locator('[data-intro-film]')).toBeVisible()
    await page.getByRole('button', { name: "Passer l'intro" }).click()
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'fin')

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'sans')
    await expect(page.locator('[data-intro-film]')).toBeHidden()

    // Retour sur l'accueil par un lien : pas de film non plus.
    await page.goto('/fr/carte')
    await page.getByRole('link', { name: 'PAACIV' }).first().click()
    await page.waitForURL(/\/fr$/)
    await expect(page.locator('[data-intro-film]')).toBeHidden()

    // Un nouvel onglet est une nouvelle visite : le film rejoue.
    const autre = await context.newPage()
    await autre.goto('/fr')
    await expect(autre.locator('[data-intro-film]')).toBeVisible()
  })
})

test.describe('chronologie par décennie', () => {
  test('la frise compte par décennie, et une décennie filtre l’archive', async ({ page }) => {
    // `?frise=decennies` force la vue qui, sinon, n'apparaît qu'au-delà de 40
    // édifices datés.
    await page.goto('/fr/archives?frise=decennies')
    const frise = page.getByTestId('frise')
    await expect(frise).toHaveAttribute('data-mode', 'decennies')

    const colonne = frise.locator('a[data-testid^="decennie-"]').first()
    const id = await colonne.getAttribute('data-testid')
    const d = id!.replace('decennie-', '')
    const total = await page.getByTestId('grille-patrimoine').getByRole('link').count()

    await colonne.click()
    await expect(page).toHaveURL(new RegExp(`decennie=${d}`))
    // Le paramètre de vue est conservé ? Non : la vue forcée n'est pas un
    // filtre. On vérifie seulement que la grille ne garde que la décennie.
    await expect(page.getByText(`années ${d}`)).toBeVisible()
    const filtres = await page.getByTestId('grille-patrimoine').getByRole('link').count()
    expect(filtres).toBeLessThanOrEqual(total)
    expect(filtres).toBeGreaterThan(0)

    await page.getByTestId('retirer-decennie').click()
    await expect(page).not.toHaveURL(/decennie=/)
  })

  test('une décennie fantaisiste dans l’URL est ignorée', async ({ page }) => {
    await page.goto('/fr/archives?decennie=1965')
    await expect(page.getByTestId('retirer-decennie')).toHaveCount(0)
    await expect(
      page.getByTestId('grille-patrimoine').getByRole('link', { name: /Basilique Notre-Dame/ }),
    ).toBeVisible()
  })
})
