// MIROIR JS du bloc `@theme` figé de app/globals.css — la palette « Terre &
// Ocre » des phases 1 à 4, recalée sur les matières (migration de la palette,
// août 2026). Les deux moitiés bougent ENSEMBLE : ce fichier avait déjà pris un
// jeu de valeurs de retard, ce qui en faisait un piège pour qui s'y fierait.
// Le test `lib/__tests__/theme.test.ts` fige les valeurs pour que la
// divergence se voie.
export const PALETTE = {
  terracotta: '#A9502A',
  brun: '#7E3F20',
  or: '#E3B183',
  vert: '#2F6A63',
  sable: '#F6F1E7',
  creme2: '#E9E1D3',
  encre: '#23262E',
} as const

export type PaletteKey = keyof typeof PALETTE
