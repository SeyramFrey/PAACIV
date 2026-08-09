import { test, expect } from '@playwright/test'

test.use({ storageState: 'playwright/.auth/admin.json' })

test("l'éditeur riche est monté dans le formulaire patrimoine", async ({ page }) => {
  await page.goto('/fr/admin/patrimoine/nouveau')
  // La barre d'outils Tiptap est rendue côté client après hydratation.
  await expect(page.getByRole('button', { name: 'Gras' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Liste à puces' })).toBeVisible()
})
