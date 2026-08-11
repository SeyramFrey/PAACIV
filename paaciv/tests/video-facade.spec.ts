import { test, expect } from '@playwright/test'

// Le seed lie un reportage publié à un patrimoine publié ; on teste ici la fiche patrimoine,
// qui porte déjà une video_url dans le seed de la Phase 2.
test("la vidéo ne charge son iframe qu'après le clic", async ({ page }) => {
  await page.goto('/fr/patrimoine/basilique-yamoussoukro')
  const facade = page.getByTestId('facade-video')
  await expect(facade).toBeVisible()
  await expect(page.locator('iframe')).toHaveCount(0) // aucun contenu Google avant action
  await facade.getByRole('button').click()
  await expect(page.locator('iframe')).toHaveCount(1)
  await expect(page.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\//)
})
