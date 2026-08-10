import { describe, it, expect } from 'vitest'
import { mapRealisationsLiees, type LiaisonRow } from '@/lib/data/architectes'

describe('mapRealisationsLiees', () => {
  it('exclut un patrimoine brouillon', () => {
    const liaisons: LiaisonRow[] = [
      {
        role: 'Architecte principal',
        patrimoine: { slug: 'x', titre_fr: 'X', titre_en: null, statut: 'brouillon', images: [] },
      },
    ]
    expect(mapRealisationsLiees(liaisons)).toEqual([])
  })

  it('conserve un patrimoine publié', () => {
    const liaisons: LiaisonRow[] = [
      {
        role: 'Architecte principal',
        patrimoine: {
          slug: 'basilique-yamoussoukro',
          titre_fr: 'Basilique',
          titre_en: 'Basilica',
          statut: 'publie',
          images: [],
        },
      },
    ]
    expect(mapRealisationsLiees(liaisons)).toEqual([
      {
        slug: 'basilique-yamoussoukro',
        titre_fr: 'Basilique',
        titre_en: 'Basilica',
        image: null,
        role: 'Architecte principal',
      },
    ])
  })

  it('conserve un role nul tel quel', () => {
    const liaisons: LiaisonRow[] = [
      {
        role: null,
        patrimoine: { slug: 'y', titre_fr: 'Y', titre_en: null, statut: 'publie', images: [] },
      },
    ]
    expect(mapRealisationsLiees(liaisons)[0]!.role).toBeNull()
  })

  it('tableau nul, absent ou vide → []', () => {
    expect(mapRealisationsLiees(null)).toEqual([])
    expect(mapRealisationsLiees(undefined)).toEqual([])
    expect(mapRealisationsLiees([])).toEqual([])
  })
})
