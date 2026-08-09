import { test, expect } from '@playwright/test'
import type { Map } from 'maplibre-gl'

test('la bascule Satellite affiche la couche raster au-dessus du fond', async ({ page }) => {
  await page.goto('/fr/carte')
  await page.waitForFunction(() => (window as unknown as { __carteReady?: boolean }).__carteReady === true)

  // Avant clic : couche satellite masquée.
  const avant = await page.evaluate(() => {
    const m = (window as unknown as { __carteMap: Map }).__carteMap
    return m.getLayoutProperty('satellite', 'visibility')
  })
  expect(avant).toBe('none')

  await page.getByRole('button', { name: 'Satellite' }).click()

  const etat = await page.evaluate(() => {
    const m = (window as unknown as { __carteMap: Map }).__carteMap
    const ids = m.getStyle().layers.map((l: { id: string }) => l.id)
    return {
      vis: m.getLayoutProperty('satellite', 'visibility'),
      satIdx: ids.indexOf('satellite'),
      pointsIdx: ids.indexOf('points'),
    }
  })
  expect(etat.vis).toBe('visible')
  expect(etat.satIdx).toBeGreaterThan(0) // au-dessus du fond (pas en position 0)
  expect(etat.pointsIdx).toBeGreaterThan(etat.satIdx) // les points restent au-dessus du satellite
})
