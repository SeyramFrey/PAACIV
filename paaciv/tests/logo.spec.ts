import { test, expect } from '@playwright/test'

// Le logo est une image matricielle dont le mot « PAACIV » est quasi noir : sur
// fond sombre il faut la variante crème, sinon il disparaît. Le choix suit LA
// SURFACE et non le thème — c'est le piège que ces tests verrouillent.

test('en haut de l’accueil, l’en-tête est transparent sur le hero sombre : variante claire', async ({ page }) => {
  await page.goto('/fr')
  const logo = page.locator('header img[alt="PAACIV"]')
  await expect(logo).toHaveCount(1)
  // Verrouillage compact : à 52 px de haut, la baseline du logo complet
  // n'est plus qu'une bavure grise, on la retire.
  await expect(logo).toHaveAttribute('src', '/logo-compact-inverse.png')
})

test('le pied de page est sombre dans les deux thèmes : toujours la variante claire', async ({ page }) => {
  for (const theme of ['dark', 'light'] as const) {
    await page.goto('/fr')
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
    const logo = page.locator('footer img[alt="PAACIV"]')
    await expect(logo, theme).toHaveCount(1)
    await expect(logo, theme).toHaveAttribute('src', '/logo-compact-inverse.png')
  }
})

// Dans le corps de page, la surface est `--bg` : elle suit le thème, et c'est
// la seule situation où les deux variantes coexistent, départagées en CSS.
test('dans le corps de page, la variante affichée suit le thème', async ({ page }) => {
  await page.goto('/fr/a-propos')
  const logo = page.locator('main .logo-paaciv')
  await expect(logo).toHaveCount(1)

  const fond = () => logo.evaluate((el) => getComputedStyle(el).backgroundImage)

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
  expect(await fond()).toContain('/logo-inverse.png')

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'))
  expect(await fond()).toContain('/logo.png')
  // Contre-épreuve : c'est bien le fichier clair, pas l'inverse dont le nom le
  // contient comme préfixe.
  expect(await fond()).not.toContain('/logo-inverse.png')
})

test('la favicone de l’emblème est servie', async ({ request }) => {
  const r = await request.get('/icon.png')
  expect(r.status()).toBe(200)
  expect(r.headers()['content-type']).toContain('image')
})
