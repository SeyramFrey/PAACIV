import { describe, it, expect } from 'vitest'
import { emailValide, montantOuNull } from '@/lib/validation'

describe('emailValide', () => {
  it('accepte les adresses usuelles', () => {
    expect(emailValide('a@b.ci')).toBe(true)
    expect(emailValide('prenom.nom+tag@paaciv.org')).toBe(true)
  })

  it('refuse ce qui n’est pas une adresse', () => {
    for (const v of ['', '   ', 'a@b', 'a b@c.ci', '@b.ci', 'a@.ci', 'a@b.']) {
      expect(emailValide(v), v).toBe(false)
    }
  })
})

describe('montantOuNull', () => {
  it('accepte un nombre positif, virgule ou point', () => {
    expect(montantOuNull('15000')).toBe(15000)
    expect(montantOuNull('1500,50')).toBe(1500.5)
    expect(montantOuNull('1500.50')).toBe(1500.5)
  })

  it('renvoie null pour vide ou absent — un don sans montant reste valide', () => {
    expect(montantOuNull(null)).toBeNull()
    expect(montantOuNull('')).toBeNull()
    expect(montantOuNull('   ')).toBeNull()
  })

  it('renvoie NaN pour une saisie non numérique ou négative, pour que l’appelant refuse', () => {
    expect(montantOuNull('beaucoup')).toBeNaN()
    expect(montantOuNull('-10')).toBeNaN()
    expect(montantOuNull('0')).toBeNaN()
  })
})
