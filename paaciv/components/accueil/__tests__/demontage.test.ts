import { describe, expect, it } from 'vitest'
import { DEBUT, FIN, partEclat } from '../demontage'

describe('partEclat', () => {
  it('rien ne bouge avant le début, tout est sorti après la fin', () => {
    for (let r = 0; r < 3; r++) {
      expect(partEclat(0, r, 3)).toBe(0)
      expect(partEclat(DEBUT, r, 3)).toBe(0)
      expect(partEclat(FIN, r, 3)).toBe(1)
      expect(partEclat(1, r, 3)).toBe(1)
    }
  })

  it('les éclats sortent l’un après l’autre, dans l’ordre', () => {
    const pas = (FIN - DEBUT) / 3
    const milieuDuDeuxieme = DEBUT + pas * 1.5
    expect(partEclat(milieuDuDeuxieme, 0, 3)).toBe(1)
    expect(partEclat(milieuDuDeuxieme, 1, 3)).toBeCloseTo(0.5)
    expect(partEclat(milieuDuDeuxieme, 2, 3)).toBe(0)
  })

  it('un éclat hors de l’ordre (sans fiche) ne se détache jamais', () => {
    expect(partEclat(1, -1, 3)).toBe(0)
  })
})
