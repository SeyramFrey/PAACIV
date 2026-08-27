import { afterEach, vi } from 'vitest'
import { STYLE_CARTE, STYLE_REPLI, styleDisponible } from '@/lib/carte-style'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

test('styleDisponible : MapTiler accepte la clé, on garde son fond', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
  expect(await styleDisponible()).toBe(STYLE_CARTE)
})

test('styleDisponible : un 403 de MapTiler bascule sur le fond libre', async () => {
  // C'est le cas réel de staging : la clé est valide mais restreinte à
  // d'autres origines. Sans ce repli, la carte reste un rectangle vide.
  vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 403 })))
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  expect(await styleDisponible()).toBe(STYLE_REPLI)
})

test('styleDisponible : un réseau injoignable ne lève pas, il replie', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
  await expect(styleDisponible()).resolves.toBe(STYLE_REPLI)
})

test('styleDisponible : sans clé, aucune requête de vérification', async () => {
  // `STYLE_CARTE` vaut alors déjà le repli : sonder une URL qu'on s'apprête
  // à utiliser telle quelle serait un aller-retour pour rien.
  const appels = vi.fn()
  vi.stubGlobal('fetch', appels)
  if (STYLE_CARTE === STYLE_REPLI) {
    expect(await styleDisponible()).toBe(STYLE_REPLI)
    expect(appels).not.toHaveBeenCalled()
  } else {
    // Une clé est configurée dans cet environnement : le cas « sans clé » est
    // couvert par la branche ci-dessus là où il s'applique.
    expect(STYLE_CARTE).toContain('maptiler')
  }
})
