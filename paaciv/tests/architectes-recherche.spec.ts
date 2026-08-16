import { test, expect } from '@playwright/test'

// La page liste les architectes en deux sections (Ivoiriens / Étrangers) sans
// aucun moyen de retrouver un nom. Le filtre porte sur les DEUX sections à la
// fois : filtrer l'une seulement laisserait croire qu'un architecte étranger
// n'existe pas parce qu'on l'a cherché depuis le haut de la page.
test('la recherche filtre les deux sections d’architectes', async ({ page }) => {
  await page.goto('/fr/architectes')

  const pastilles = page.getByTestId('pastille-architecte')
  const total = await pastilles.count()
  expect(total).toBeGreaterThan(2)

  // Un architecte de la section « Étrangers ».
  await page.getByRole('searchbox', { name: /rechercher un architecte/i }).fill('olivieri')
  await expect(pastilles).toHaveCount(1)
  await expect(pastilles.first()).toContainText(/olivieri/i)

  // Le compte est annoncé, sans quoi le filtrage n'a aucun retour perceptible
  // pour qui n'voit pas la grille se réduire.
  await expect(page.getByText(/1 architecte/i)).toBeVisible()

  // Insensible aux accents : « leon » doit trouver « Jean Léon ». C'est le cas
  // courant d'une saisie au clavier de téléphone.
  await page.getByRole('searchbox', { name: /rechercher un architecte/i }).fill('leon')
  await expect(pastilles).toHaveCount(1)
  await expect(pastilles.first()).toContainText(/Léon/i)

  // Vider la recherche restaure la liste entière.
  await page.getByRole('searchbox', { name: /rechercher un architecte/i }).fill('')
  await expect(pastilles).toHaveCount(total)
})
