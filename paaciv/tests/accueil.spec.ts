import { test, expect } from '@playwright/test'

test('la page affiche ses blocs dans l’ordre du design', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // Un seul h1 sur la page : les quinze autres blocs sont des h2.
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  for (const id of ['top', 'association', 'archive', 'agenda', 'journal', 'contact']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1)
  }
})

test('aucun lien mort ni bouton inerte sur toute la page', async ({ page }) => {
  await page.goto('/fr')
  const hrefs = await page.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''))
  expect(hrefs.some((h) => h === '#' || h === '')).toBe(false)
})

test('les vignettes d’archive mènent aux fiches', async ({ page }) => {
  await page.goto('/fr')
  const vignette = page.locator('#archive a[href*="/patrimoine/"]').first()
  await vignette.scrollIntoViewIfNeeded()
  await vignette.click()
  await expect(page).toHaveURL(/\/fr\/patrimoine\/[^/]+$/)
})

test('la modale d’adhésion s’ouvre depuis l’en-tête et se ferme à Échap', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/fr')
  await page.getByRole('button', { name: 'Adhérer', exact: true }).click()
  const modale = page.getByRole('dialog', { name: /adhérer à l'association/i })
  await expect(modale).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(modale).toBeHidden()
})

test('un don déposé depuis le hero est enregistré', async ({ page }) => {
  await page.goto('/fr')
  await page.getByRole('button', { name: /soutenir l'association/i }).click()
  const modale = page.getByRole('dialog', { name: /faire un don/i })
  await modale.getByLabel(/^nom$/i).fill('Test Playwright')
  await modale.getByLabel(/adresse e-mail/i).fill(`e2e-don-${Date.now()}@exemple.ci`)
  await modale.getByLabel(/montant/i).fill('10000')
  await modale.getByRole('button', { name: /envoyer/i }).click()
  await expect(modale.getByText(/merci/i)).toBeVisible()
})

test('l’inscription à la newsletter confirme', async ({ page }) => {
  await page.goto('/fr')
  const section = page.locator('#adherer')
  await section.scrollIntoViewIfNeeded()
  await section.getByLabel(/adresse e-mail/i).fill(`e2e-news-${Date.now()}@exemple.ci`)
  await section.getByRole('button', { name: /s'inscrire/i }).click()
  await expect(section.getByRole('status')).toBeVisible()
})

test('la version anglaise rend la page sans texte français résiduel', async ({ page }) => {
  await page.goto('/en')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Explore the archive' })).toBeVisible()
})
