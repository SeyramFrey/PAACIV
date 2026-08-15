import { test, expect } from '@playwright/test'

test('le header et le footer sont présents sur l\'accueil', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.getByRole('link', { name: 'PAACIV' })).toBeVisible()
  // Ciblage explicite : depuis la Task 9, le menu mobile ajoute un second
  // point de repère « navigation » (masqué mais présent hors petit écran),
  // d'où le nom accessible pour lever l'ambiguïté du mode strict.
  // « Carte » avec capitale ne matcherait pas le libellé réel « La carte »
  // (minuscule) : `toContainText` est sensible à la casse par défaut.
  await expect(page.getByRole('navigation', { name: /principale/i })).toContainText(/carte/i)
  // L'adresse de contact du pied de page vient désormais de `contenu_site`
  // (footer_email) et porte volontairement le marqueur « À COMPLÉTER » tant
  // que l'association ne l'a pas renseignée : on ne peut plus asserter une
  // valeur littérale. On vérifie à la place ce qui est réellement stable —
  // que la rubrique de contact du pied de page est bien rendue.
  await expect(page.getByRole('contentinfo')).toContainText('Nous joindre')
  await expect(page.getByRole('contentinfo')).toContainText('LinkedIn')
})

test('la navigation expose les trois rubriques éditoriales', async ({ page }) => {
  await page.goto('/fr')
  const nav = page.getByRole('navigation', { name: /principale/i }).first()
  // Les URL ne changent pas ; seuls les libellés sont renommés par la Task 9
  // (Articles → Journal, Événements → Agenda).
  for (const [libelle, href] of [
    ['Journal', '/fr/articles'],
    ['Reportages', '/fr/reportages'],
    ['Agenda', '/fr/evenements'],
  ] as const) {
    await expect(nav.getByRole('link', { name: libelle })).toHaveAttribute('href', href)
  }
})

test('aucun lien de navigation ne pointe vers /actualites', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.locator('a[href$="/actualites"]')).toHaveCount(0)
})
