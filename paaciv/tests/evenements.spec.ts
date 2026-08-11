import { test, expect } from '@playwright/test'

test("l'index affiche les deux sections, chacune avec le bon événement", async ({ page }) => {
  await page.goto('/fr/evenements')
  const aVenir = page.getByRole('region', { name: 'À venir' })
  const passes = page.getByRole('region', { name: 'Passés' })
  await expect(aVenir.getByText('Exposition', { exact: false })).toBeVisible()
  await expect(passes.getByText('Conférence', { exact: false })).toBeVisible()
  // l'événement à venir ne doit pas se retrouver dans les passés
  await expect(passes.getByText('Exposition', { exact: false })).toHaveCount(0)
})

test('un événement brouillon renvoie 404', async ({ page }) => {
  const res = await page.goto('/fr/evenements/evenement-brouillon')
  expect(res?.status()).toBe(404)
})

test('la fiche événement affiche le lieu et les dates', async ({ page }) => {
  await page.goto('/fr/evenements/exposition-a-venir')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByTestId('evenement-dates')).toBeVisible()
})
