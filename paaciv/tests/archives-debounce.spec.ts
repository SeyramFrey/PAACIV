import { test, expect } from '@playwright/test'

test('la recherche archives est débouncée (une seule navigation)', async ({ page }) => {
  await page.goto('/fr/archives')
  const recherche = page.getByRole('searchbox')
  await recherche.pressSequentially('gare', { delay: 20 }) // ~80 ms < 300 ms
  // Juste après une frappe rapide, l'URL n'a pas encore le paramètre q.
  await page.waitForTimeout(150)
  expect(page.url()).not.toContain('q=gare')
  // Après le délai de débounce, la navigation a eu lieu.
  await expect(page).toHaveURL(/q=gare/)
})
