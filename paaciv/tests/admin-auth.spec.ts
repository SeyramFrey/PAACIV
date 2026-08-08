import { test, expect } from '@playwright/test'

test('un visiteur non connecté est redirigé de /admin vers /login', async ({ page }) => {
  await page.goto('/fr/admin')
  await expect(page).toHaveURL(/\/fr\/login/)
})
