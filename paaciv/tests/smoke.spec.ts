import { test, expect } from '@playwright/test'

test('la page racine répond', async ({ page }) => {
  const res = await page.goto('/')
  expect(res?.status()).toBeLessThan(400)
})
