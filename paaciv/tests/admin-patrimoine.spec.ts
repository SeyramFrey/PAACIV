import { test, expect } from '@playwright/test'

test.use({ storageState: 'playwright/.auth/admin.json' })

test('la liste admin affiche les patrimoines dont les brouillons', async ({ page }) => {
  await page.goto('/fr/admin/patrimoine')
  await expect(page.getByRole('heading', { name: 'Patrimoine' })).toBeVisible()
  // le brouillon (invisible côté public) est visible en admin
  await expect(page.getByText('Aéroport Félix Houphouët-Boigny')).toBeVisible()
})
