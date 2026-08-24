import { test, expect } from '@playwright/test'
import type { Map } from 'maplibre-gl'

// Lecture de la carte par ÉTAT DE CONSERVATION.
//
// La carte ne savait dire que « de quoi s'agit-il » (typologie). Elle sait
// désormais dire aussi « qu'est-ce qui est menacé », qui est le propos de
// l'association. Les deux lectures dessinent exactement les mêmes points : la
// bascule REPEINT la couche au lieu de recharger quoi que ce soit, ce qui rend
// la comparaison immédiate, l'œil gardant les mêmes repères.
//
// Ce n'est PAS un filtre, et c'est ce que ces tests protègent en premier : le
// compteur ne doit pas bouger. Un « filtre » qui ne retire rien et une « clé de
// lecture » qui retirerait des points seraient l'un comme l'autre trompeurs.

/** Attend que le gestionnaire `load` ait posé la source et les couches. */
async function carteChargee(page: import('@playwright/test').Page) {
  await page.goto('/fr/carte')
  await page.waitForFunction(
    () => (window as unknown as { __carteReady?: boolean }).__carteReady === true,
  )
}

const peinture = () =>
  (() => {
    const m = (window as unknown as { __carteMap: Map }).__carteMap
    return {
      couleur: JSON.stringify(m.getPaintProperty('points', 'circle-color')),
      rayon: JSON.stringify(m.getPaintProperty('points', 'circle-radius')),
      opacite: JSON.stringify(m.getPaintProperty('points', 'circle-opacity')),
    }
  })()

test('la bascule repeint la couche des points sans en retirer un seul', async ({ page }) => {
  await carteChargee(page)

  const compteur = page.getByTestId('compteur-carte')
  const avant = await compteur.textContent()
  // Un compteur à zéro rendrait l'invariant « le compte ne bouge pas »
  // vacuement vrai : on s'assure qu'il y a bien des points à comparer.
  expect(avant).not.toMatch(/^0 /)

  const peintureType = await page.evaluate(peinture)
  // La couleur suit `type_id` tant qu'on lit par typologie.
  expect(peintureType.couleur).toContain('type_id')
  expect(peintureType.couleur).not.toContain('etat_conservation')

  await page.getByTestId('lecture-etat').click()
  await expect(page.getByTestId('lecture-etat')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('lecture-type')).toHaveAttribute('aria-pressed', 'false')

  const peintureEtat = await page.evaluate(peinture)
  expect(peintureEtat.couleur).toContain('etat_conservation')
  // Le démoli est rapetissé et estompé : la couleur seule ne dit pas qu'il n'y
  // a plus de bâtiment, un point gris de même taille se lirait comme une
  // catégorie parmi d'autres alors que c'est une absence.
  expect(peintureEtat.rayon).toContain('demoli')
  expect(peintureEtat.opacite).toContain('demoli')

  // L'invariant central : aucun point n'a disparu. Ce n'est pas un filtre.
  await expect(compteur).toHaveText(avant!)

  // Et le retour en arrière rend exactement la peinture de départ.
  await page.getByTestId('lecture-type').click()
  expect(await page.evaluate(peinture)).toEqual(peintureType)
})

// Une légende des typologies affichée pendant que les points sont peints par
// état serait un contresens pur et simple.
test('la légende suit la clé de lecture', async ({ page }) => {
  await page.goto('/fr/carte')
  await expect(page.getByTestId('legende-type').first()).toBeVisible()
  await expect(page.getByTestId('legende-etat')).toHaveCount(0)

  await page.getByTestId('lecture-etat').click()
  await expect(page.getByTestId('legende-type')).toHaveCount(0)

  const etats = page.getByTestId('legende-etat')
  // Quatre états du vocabulaire, plus « Non renseigné ».
  await expect(etats).toHaveCount(5)
  await expect(etats.first()).toBeVisible()
  // « Non renseigné » DOIT figurer dans la légende : sans lui, le visiteur
  // lirait les points gris comme une cinquième catégorie inconnue — ou pire,
  // comme des édifices intacts.
  await expect(etats.filter({ hasText: 'Non renseigné' })).toHaveCount(1)
})

// La couleur seule n'est pas une légende pour qui la distingue mal : chaque
// typologie porte aussi son pictogramme, annonçable.
test('la légende des typologies porte un pictogramme nommé', async ({ page }) => {
  await page.goto('/fr/carte')
  const ligne = page.getByTestId('legende-type').filter({ hasText: 'Édifice religieux' })
  await expect(ligne.getByRole('img', { name: 'Édifice religieux' })).toBeVisible()
})
