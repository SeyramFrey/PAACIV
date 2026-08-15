import { test, expect } from '@playwright/test'
import type { Map } from 'maplibre-gl'

// Quitter /carte avant la fin du chargement est une situation NORMALE : un
// visiteur pressé, React StrictMode qui monte l'effet deux fois en
// développement, un Fast Refresh qui remonte le composant. Le nettoyage appelle
// alors `map.remove()`, qui annule les requêtes encore en vol (sprite, TileJSON,
// tuiles) — et lève une `AbortError` native (« signal is aborted without
// reason ») depuis l'intérieur du nettoyage d'effet. React la remonte, l'overlay
// de développement de Next 16 en fait une carte d'erreur bloquante posée sur la
// carte, et en production elle atterrit dans la console des visiteurs.
//
// La fenêtre est étroite : on la force en servant le style normalement (sinon
// aucune requête suivante ne part, il n'y a rien à annuler) tout en retenant
// sprite / TileJSON / tuiles.
test('quitter la carte pendant son chargement ne remonte aucune erreur', async ({ page }) => {
  const erreurs: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') erreurs.push(m.text().split('\n')[0])
  })

  let retenues = 0
  await page.route(/maptiler\.com|openfreemap\.org|arcgisonline\.com/, async (route) => {
    const url = route.request().url()
    // Le style doit arriver : c'est lui qui déclenche sprite, glyphes et tuiles.
    if (url.includes('style.json') || url.includes('/styles/')) {
      await route.continue().catch(() => {})
      return
    }
    retenues += 1
    await new Promise((r) => setTimeout(r, 8000))
    await route.continue().catch(() => {})
  })

  await page.goto('/fr/carte', { waitUntil: 'commit' })
  await page.waitForFunction(() => Boolean((window as unknown as { __carteMap?: Map }).__carteMap))
  await expect.poll(() => retenues, { timeout: 20000 }).toBeGreaterThan(0)

  // Navigation CLIENT (clic sur le menu) et non `page.goto` : un rechargement
  // complet détruirait la page sans jamais exécuter le nettoyage d'effet, donc
  // sans exercer le bug.
  await page.getByRole('link', { name: 'Architectes' }).first().click()
  await page.waitForURL(/\/architectes/)
  await page.waitForTimeout(2000)

  expect(erreurs).toEqual([])
})
