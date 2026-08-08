import { PALETTE } from '@/lib/theme'

test('la palette expose les couleurs exactes de la charte', () => {
  expect(PALETTE.terracotta).toBe('#B5581F')
  expect(PALETTE.brun).toBe('#8A3E1B')
  expect(PALETTE.or).toBe('#D9A441')
  expect(PALETTE.vert).toBe('#46603F')
  expect(PALETTE.sable).toBe('#F4EBDD')
  expect(PALETTE.encre).toBe('#2A2320')
})
