import { describe, it, expect } from 'vitest'
import { grouperParVille, trouverVille, cleTexteVille } from '@/lib/villes'

const f = (ville: string | null, slug = ville ?? 'x') => ({ ville, slug })

describe('grouperParVille', () => {
  it('rassemble les fiches d’une même commune', () => {
    const g = grouperParVille([f('Abidjan', 'a'), f('Abidjan', 'b'), f('Yamoussoukro', 'c')])
    expect(g.map((x) => x.slug)).toEqual(['abidjan', 'yamoussoukro'])
    expect(g[0].items).toHaveLength(2)
  })

  it('réunit les variantes de saisie sous une seule commune', () => {
    // Sans cette normalisation, « Grand Bassam » créerait une commune fantôme
    // à un seul édifice, et un doublon dans le compteur « Communes ».
    const g = grouperParVille([f('Grand-Bassam', 'a'), f('grand bassam', 'b'), f('GRAND-BASSAM', 'c')])
    expect(g).toHaveLength(1)
    expect(g[0].slug).toBe('grand-bassam')
    expect(g[0].items).toHaveLength(3)
  })

  it('affiche le nom de la première fiche reçue', () => {
    expect(grouperParVille([f('Grand-Bassam'), f('grand bassam')])[0].nom).toBe('Grand-Bassam')
  })

  it('écarte les fiches sans commune plutôt que d’inventer une entrée', () => {
    expect(grouperParVille([f(null), f('   '), f('Abidjan')]).map((x) => x.slug)).toEqual(['abidjan'])
  })

  it('écarte un nom qui ne produit aucun slug — il donnerait l’URL de l’index', () => {
    expect(grouperParVille([f('———'), f('???')])).toEqual([])
  })

  it('trie les communes par nom, accents compris', () => {
    const g = grouperParVille([f('Yamoussoukro'), f('Éhania'), f('Abidjan'), f('Bouaké')])
    expect(g.map((x) => x.nom)).toEqual(['Abidjan', 'Bouaké', 'Éhania', 'Yamoussoukro'])
  })
})

describe('trouverVille', () => {
  it('retrouve une commune par son slug d’URL', () => {
    const v = trouverVille([f('Grand-Bassam', 'a'), f('Abidjan', 'b')], 'grand-bassam')
    expect(v?.nom).toBe('Grand-Bassam')
  })

  it('rend le MÊME compte que l’index pour une commune à variantes de saisie', () => {
    // C'est la raison d'être du passage par `grouperParVille` : un filtre écrit
    // à part finirait par diverger, et la page d'une commune annoncerait alors
    // un nombre d'édifices différent de celui affiché sur l'index.
    const lignes = [f('Grand-Bassam', 'a'), f('grand bassam', 'b')]
    expect(trouverVille(lignes, 'grand-bassam')?.items).toHaveLength(2)
    expect(grouperParVille(lignes)[0].items).toHaveLength(2)
  })

  it('rend undefined sur un slug inconnu', () => {
    expect(trouverVille([f('Abidjan')], 'kong')).toBeUndefined()
  })
})

describe('cleTexteVille', () => {
  it('préfixe par `ville_`, ce qui range la clé dans le groupe d’admin dédié', () => {
    expect(cleTexteVille('grand-bassam')).toBe('ville_grand-bassam_intro')
  })
})
