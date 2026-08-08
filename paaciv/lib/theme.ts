export const PALETTE = {
  terracotta: '#B5581F',
  brun: '#8A3E1B',
  or: '#D9A441',
  vert: '#46603F',
  sable: '#F4EBDD',
  creme2: '#EADFCB',
  encre: '#2A2320',
} as const

export type PaletteKey = keyof typeof PALETTE
