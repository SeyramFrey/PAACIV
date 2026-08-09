import { test, expect } from '@playwright/test'

test('les filtres carte réduisent le nombre de points', async ({ page, request }) => {
  // Nombre attendu pour le type « religieux », source de vérité = l'API.
  const res = await request.get('/api/carte/points?type=religieux')
  const attendu = (await res.json()).features.length
  expect(attendu).toBeGreaterThan(0)

  await page.goto('/fr/carte')
  await page.waitForFunction(() => (window as unknown as { __carteReady?: boolean }).__carteReady === true)

  // Total initial : 7 édifices publiés.
  await expect(page.getByTestId('compteur-carte')).toContainText('7')

  await page.getByLabel('Type').selectOption('religieux')

  await expect(page.getByTestId('compteur-carte')).toContainText(new RegExp(`\\b${attendu}\\b`))
})
