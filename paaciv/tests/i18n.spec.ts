import { test, expect } from '@playwright/test'

test('la racine redirige vers /fr', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/fr$/)
})

test('bascule FR -> EN', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.getByTestId('accroche')).toContainText('patrimoine')
  await page.goto('/en')
  await expect(page.getByTestId('accroche')).toContainText('heritage')
})
