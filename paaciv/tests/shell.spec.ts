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
  // valeur littérale (round 1 : une assertion sur un libellé de traduction
  // statique passerait même si `chargerTextes()` ne renvoyait rien).
  // À la place, on verrouille le vrai risque : le marqueur de chantier ne
  // doit jamais fuiter en public. Vrai aujourd'hui (SiteFooter le masque),
  // le restera quand l'association fournira ses coordonnées, et
  // détecterait une régression si le marqueur réapparaissait.
  await expect(page.getByRole('contentinfo')).not.toContainText('À COMPLÉTER')
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
