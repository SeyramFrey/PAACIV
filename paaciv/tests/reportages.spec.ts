import { test, expect } from '@playwright/test'
import { creerReportageLie, type ReportageLie } from './aide-reportage-lie'

let lie: ReportageLie
test.beforeAll(async () => { lie = await creerReportageLie('index') })
test.afterAll(async () => { await lie?.supprimer() })

test("l'index reportages affiche des vignettes vidéo", async ({ page }) => {
  await page.goto('/fr/reportages')
  await expect(page.getByRole('heading', { name: 'Reportages', level: 1 })).toBeVisible()
  const premiere = page.getByTestId('carte-reportage').first()
  await expect(premiere).toBeVisible()
  await expect(premiere.locator('img')).toHaveAttribute('src', /i\.ytimg\.com/)
  // Pastille de lecture (spec §6) : distingue la grille reportages des
  // cartes articles, qui partagent le même composant CarteContenu.
  await expect(premiere.getByText('▶')).toBeVisible()
})

test("la fiche reportage ne charge l'iframe qu'au clic", async ({ page }) => {
  await page.goto(`/fr/reportages/${lie.slug}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByTestId('patrimoine-lie')).toBeVisible()
  await expect(page.locator('iframe')).toHaveCount(0)
  await page.getByTestId('facade-video').getByRole('button').click()
  await expect(page.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com/)
})

test('un reportage brouillon renvoie 404', async ({ page }) => {
  const res = await page.goto('/fr/reportages/reportage-brouillon')
  expect(res?.status()).toBe(404)
})
