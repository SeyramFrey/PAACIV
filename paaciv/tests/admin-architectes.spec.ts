import { test, expect } from '@playwright/test'

test.use({ storageState: 'playwright/.auth/admin.json' })

test('la liste admin affiche les architectes dont le brouillon', async ({ page }) => {
  await page.goto('/fr/admin/architectes')
  await expect(page.getByRole('heading', { name: 'Architectes' })).toBeVisible()
  await expect(page.getByText('Pierre Fakhoury')).toBeVisible()
  // le brouillon (invisible côté public) est visible en admin
  await expect(page.getByText('Amara Koffi')).toBeVisible()
  // lien vers la création d'une nouvelle fiche
  await expect(page.getByRole('link', { name: 'Nouvel architecte' })).toBeVisible()
})

test("le tableau de bord admin expose un lien vers l'espace architectes", async ({ page }) => {
  await page.goto('/fr/admin')
  await expect(page.getByRole('main').getByRole('link', { name: 'Architectes' })).toBeVisible()
})
