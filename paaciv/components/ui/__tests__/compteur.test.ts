import { describe, it, expect } from 'vitest'
import { paliersCompteur } from '@/lib/compteur'

describe('paliersCompteur', () => {
  it('part de 0 et finit exactement sur la cible', () => {
    const p = paliersCompteur(1240, 40)
    expect(p[0]).toBe(0)
    expect(p[p.length - 1]).toBe(1240)
    expect(p).toHaveLength(41)
  })

  it('ne renvoie que des entiers croissants', () => {
    const p = paliersCompteur(37, 20)
    expect(p.every(Number.isInteger)).toBe(true)
    expect(p.every((v, i) => i === 0 || v >= p[i - 1])).toBe(true)
  })

  it('gère une cible de 0 sans diviser par zéro', () => {
    expect(paliersCompteur(0, 10)).toEqual(Array(11).fill(0))
  })
})
