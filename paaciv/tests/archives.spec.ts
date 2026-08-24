import { test, expect } from '@playwright/test'

// Depuis la frise chronologique, une fiche est liée DEUX FOIS sur /archives :
// une fois sur l'axe, une fois dans la grille. Les sélecteurs disent donc de
// quelle lecture ils parlent — ce qui rend ces tests plus précis qu'avant, et
// non plus permissifs : ils vérifient désormais que la fiche est là où on
// l'attend, et non « quelque part sur la page ».

test('la page archives liste les patrimoines publiés', async ({ page }) => {
  await page.goto('/fr/archives')
  await expect(page.getByRole('heading', { name: 'Nos archives' })).toBeVisible()
  await expect(
    page.getByTestId('grille-patrimoine').getByRole('link', { name: /Basilique Notre-Dame/ }),
  ).toBeVisible()
})

test("le filtre par type restreint les résultats via l'URL", async ({ page }) => {
  await page.goto('/fr/archives?type=religieux')
  const grille = page.getByTestId('grille-patrimoine')
  await expect(grille.getByRole('link', { name: /Basilique Notre-Dame/ })).toBeVisible()
  await expect(grille.getByRole('link', { name: /La Pyramide/ })).toHaveCount(0)
  // Le filtre doit valoir pour LES DEUX lectures : une frise qui continuerait
  // d'afficher tout le corpus pendant que la grille est filtrée répondrait à
  // côté de la question que le visiteur vient de poser.
  await expect(page.getByTestId('frise').getByRole('link', { name: /La Pyramide/ })).toHaveCount(0)
})
