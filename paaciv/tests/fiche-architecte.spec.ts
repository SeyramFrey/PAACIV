import { test, expect } from '@playwright/test'

test('la fiche architecte affiche le nom et la bio', async ({ page }) => {
  await page.goto('/fr/architectes/pierre-fakhoury')
  await expect(page.getByRole('heading', { name: 'Pierre Fakhoury' })).toBeVisible()
  await expect(page.getByText('Concepteur de la Basilique de Yamoussoukro.')).toBeVisible()
})

test('la fiche architecte affiche la réalisation liée publiée', async ({ page }) => {
  await page.goto('/fr/architectes/pierre-fakhoury')
  const lien = page.getByRole('link', { name: /Basilique Notre-Dame de la Paix/ })
  await expect(lien).toBeVisible()
  await expect(lien).toHaveAttribute('href', '/fr/patrimoine/basilique-yamoussoukro')
})

test('un architecte inexistant renvoie 404', async ({ page }) => {
  const res = await page.goto('/fr/architectes/nexiste-pas')
  expect(res?.status()).toBe(404)
})

test('un architecte au statut brouillon renvoie 404 en accès direct', async ({ page }) => {
  const res = await page.goto('/fr/architectes/architecte-brouillon')
  expect(res?.status()).toBe(404)
})
