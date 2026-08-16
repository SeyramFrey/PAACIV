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

  it('neutralise l’injection de formule (=, +, -, @)', () => {
    // Excel/LibreOffice exécutent comme une formule toute cellule commençant
    // par ces quatre caractères à l'ouverture du fichier. lib/validation.ts
    // accepte volontairement une adresse comme « =1+1@exemple.ci » : un
    // anonyme peut donc déposer une adresse-piège via le formulaire
    // newsletter public, qui ressortirait telle quelle dans l'export.
    expect(versCsv([{ a: '=1+1', b: '+1', c: '-1', d: '@SUM(A1)' }])).toBe(
      "a,b,c,d\r\n'=1+1,'+1,'-1,'@SUM(A1)",
    )
  })
})
