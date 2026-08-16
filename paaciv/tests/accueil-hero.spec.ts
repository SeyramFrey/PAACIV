import { test, expect } from '@playwright/test'

// Le hero déclare `min-h-[100svh]` : il est conçu pour tenir dans le premier
// écran. Il n'y tenait pas. Le `<h1>` recevait un titre unique venu du CMS
// dans une colonne plafonnée à 900 px, ce qui le faisait retomber sur QUATRE
// lignes (523 px) là où la maquette en pose deux (261 px) ; la section montait
// alors à 1053 px pour un écran de 1000, et sa colonne de droite — le bloc
// « Vues » avec les vignettes de sélection — passait sous la ligne de
// flottaison. Le visiteur ne pouvait pas savoir qu'elle existait.
//
// Trois formats larges plutôt qu'un seul : le défaut ne se voyait PAS en
// 1920×1080 (le seul format où la section tenait par chance), ce qui est
// précisément la raison pour laquelle il a traversé toute la phase.
const FORMATS = [
  { largeur: 2000, hauteur: 1000 },
  { largeur: 1600, hauteur: 900 },
  { largeur: 1366, hauteur: 768 },
  { largeur: 1280, hauteur: 800 },
]

for (const { largeur, hauteur } of FORMATS) {
  test(`en ${largeur}×${hauteur}, les vignettes du hero sont dans le premier écran`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: hauteur })
    await page.goto('/fr')

    const vignettes = page.getByRole('button', { name: /voir/i }).first()
    await expect(vignettes).toBeVisible()

    const boite = await vignettes.boundingBox()
    expect(boite).not.toBeNull()
    // Sans défilement : `boundingBox` est relatif au viewport, et rien n'a
    // défilé depuis `goto`. Le bas des vignettes doit donc tomber au-dessus
    // de la ligne de flottaison.
    expect(boite!.y + boite!.height).toBeLessThanOrEqual(hauteur)
    expect(boite!.y).toBeGreaterThan(0)

    // L'INVARIANT DE FOND, et l'assertion qui mord le plus largement : le hero
    // déclare `min-h-[100svh]`, il ne doit donc pas DÉPASSER la hauteur du
    // premier écran. Sans elle, le format 2000×1000 restait vert alors que la
    // section montait à 1053 px — les vignettes s'y arrêtaient au tout dernier
    // pixel, ce qui suffit à les faire disparaître dès que le navigateur prend
    // quelques pixels de plus pour sa propre interface. C'est exactement le
    // format d'où venait le signalement.
    const hauteurSection = await page.locator('#top').evaluate((el) => el.getBoundingClientRect().height)
    expect(Math.round(hauteurSection)).toBeLessThanOrEqual(hauteur)
  })
}

// Le titre était révélé par le moteur `data-rv`/`data-clip`, qui n'agit
// qu'APRÈS l'hydratation, puis attendait encore 350 ms de délai et 1,4 s de
// transition. La maquette, elle, l'anime en CSS pur dès l'analyse de la
// feuille de style (`animation: drop 1.1s .35s both`). Cette assertion
// verrouille le retour au mécanisme de la maquette : c'est lui qui supprime
// l'attente de l'hydratation, pas un réglage de durée.
test('le titre du hero est animé au chargement, sans attendre le moteur de révélation', async ({ page }) => {
  await page.goto('/fr')
  const titre = page.locator('#top h1')
  await expect(titre).toHaveAttribute('data-drop', '')
  const animation = await titre.evaluate((el) => getComputedStyle(el).animationName)
  expect(animation).toBe('drop')
  // Et il ne dépend plus du moteur de révélation.
  await expect(titre).not.toHaveAttribute('data-clip', '')
})
