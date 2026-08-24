import { PALETTE } from '@/lib/theme'

test('la palette expose les couleurs exactes de la charte', () => {
  // Ces valeurs doivent rester IDENTIQUES au bloc `@theme` de
  // app/globals.css. Le test n'a pas d'autre objet : faire échouer le jour où
  // l'une des deux moitiés bouge sans l'autre.
  expect(PALETTE.terracotta).toBe('#A9502A')
  expect(PALETTE.brun).toBe('#7E3F20')
  expect(PALETTE.or).toBe('#E3B183')
  expect(PALETTE.vert).toBe('#2F6A63')
  expect(PALETTE.sable).toBe('#F6F1E7')
  expect(PALETTE.encre).toBe('#23262E')
})
