import { describe, it, expect } from 'vitest'
import { versCsv } from '@/lib/csv'

describe('versCsv', () => {
  it('écrit l’en-tête puis les lignes', () => {
    expect(versCsv([{ email: 'a@b.ci', langue: 'fr' }])).toBe('email,langue\r\na@b.ci,fr')
  })

  it('échappe les guillemets, virgules et sauts de ligne', () => {
    const csv = versCsv([{ nom: 'Diaby, Souleymane', message: 'Il a dit "oui"\nhier' }])
    expect(csv).toContain('"Diaby, Souleymane"')
    expect(csv).toContain('"Il a dit ""oui""\nhier"')
  })

  it('rend une cellule vide pour null', () => {
    expect(versCsv([{ a: null, b: 1 }])).toBe('a,b\r\n,1')
  })

  it('renvoie une chaîne vide sans ligne', () => {
    expect(versCsv([])).toBe('')
  })
})
