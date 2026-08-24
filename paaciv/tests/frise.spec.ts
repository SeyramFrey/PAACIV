import { test, expect } from '@playwright/test'

// La frise chronologique ne montre aucune donnée nouvelle : `annee_debut`,
// `epoque_id` et `etat_conservation` étaient déjà en base depuis la phase 2 et
// n'apparaissaient qu'au bas d'une fiche ouverte. Ce que ces tests vérifient,
// c'est qu'elle les REND LISIBLES — les bandes d'époque, l'axe gradué, et le
// fait qu'aucune fiche ne soit perdue en route.
//
// La géométrie (placement, voies, bornes) est couverte par des tests unitaires
// sur `lib/frise.ts`, où elle est pure ; inutile de la retester à travers un
// navigateur.

test('la frise situe les édifices sur les périodes du pays', async ({ page }) => {
  await page.goto('/fr/archives')
  const frise = page.getByTestId('frise')
  await expect(frise).toBeVisible()

  // Les trois périodes viennent de la table `epoques` et de ses bornes
  // numériques (migration 0029), pas de constantes écrites dans le composant.
  for (const periode of ['Précolonial', 'Colonial', 'Post-indépendance']) {
    await expect(frise.getByText(periode, { exact: true })).toBeVisible()
  }

  // Le pont date de 1957, la basilique de 1990 : c'est exactement ce que la
  // frise sert à faire voir d'un coup d'œil.
  // Le nom accessible d'un lien est normalisé sur une seule ligne par le
  // navigateur : `.*` suffit, sans avoir besoin du drapeau `s`.
  await expect(frise.getByRole('link', { name: /Pont Félix Houphouët-Boigny.*1957/ })).toBeVisible()
  await expect(frise.getByRole('link', { name: /Basilique Notre-Dame.*1990/ })).toBeVisible()
})

// La zone défile horizontalement : si elle n'était pas atteignable au clavier,
// tout ce qui se trouve à droite du cadre serait hors d'atteinte pour qui
// n'utilise pas de souris.
test('la frise est atteignable au clavier et porte un nom', async ({ page }) => {
  await page.goto('/fr/archives')
  const zone = page.getByTestId('frise').getByRole('group')
  await expect(zone).toHaveAttribute('tabindex', '0')
  await expect(zone).toHaveAttribute('aria-label', /Frise chronologique/)
})

// L'INVARIANT le plus important de la frise : elle ne perd aucune fiche.
//
// Une fiche non datable — « fin XIXᵉ – début XXᵉ » ne contient aucun millésime
// — n'est pas placée au hasard sur l'axe : elle est listée sous la frise, dans
// la mention « hors frise ». Ce test compte donc TOUS les liens de la section,
// axe et mention confondus, et les compare à la grille. Une frise qui
// escamoterait une fiche donnerait un compte faux de l'archive, sans que rien
// ne le signale.
test('la frise ne perd aucune fiche : ce qu’elle ne date pas, elle le nomme', async ({ page }) => {
  await page.goto('/fr/archives')
  const dansLaFrise = await page.getByTestId('frise').getByRole('link').count()
  const dansLaGrille = await page.getByTestId('grille-patrimoine').getByRole('link').count()
  expect(dansLaFrise).toBe(dansLaGrille)
})
