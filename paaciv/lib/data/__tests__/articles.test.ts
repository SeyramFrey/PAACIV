import { describe, it, expect } from 'vitest'
import { mapPatrimoineLie, type PatrimoineLieRow } from '@/lib/data/articles'

describe('mapPatrimoineLie', () => {
  it('exclut un patrimoine brouillon', () => {
    const row: PatrimoineLieRow = {
      slug: 'x',
      titre_fr: 'X',
      titre_en: null,
      statut: 'brouillon',
    }
    expect(mapPatrimoineLie(row)).toBeNull()
  })

  it('conserve un patrimoine publié, sans le champ statut', () => {
    const row: PatrimoineLieRow = {
      slug: 'la-pyramide-abidjan',
      titre_fr: 'La Pyramide',
      titre_en: 'The Pyramid',
      statut: 'publie',
    }
    expect(mapPatrimoineLie(row)).toEqual({
      slug: 'la-pyramide-abidjan',
      titre_fr: 'La Pyramide',
      titre_en: 'The Pyramid',
    })
  })

  it('renvoie null pour un patrimoine absent (null ou undefined)', () => {
    expect(mapPatrimoineLie(null)).toBeNull()
    expect(mapPatrimoineLie(undefined)).toBeNull()
  })
})
