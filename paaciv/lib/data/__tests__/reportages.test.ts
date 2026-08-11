import { describe, it, expect } from 'vitest'
import { mapPatrimoineLie, miniatureReportage, type PatrimoineLieRow } from '@/lib/data/reportages'

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

describe('miniatureReportage', () => {
  it('renvoie une miniature ytimg pour une URL YouTube exploitable', () => {
    expect(miniatureReportage('https://youtu.be/PAACIVdemo3')).toBe(
      'https://i.ytimg.com/vi/PAACIVdemo3/hqdefault.jpg',
    )
  })

  it("renvoie null pour une URL non exploitable, sans planter (dégradation gracieuse)", () => {
    expect(miniatureReportage('https://example.com/pas-une-video')).toBeNull()
    expect(miniatureReportage('')).toBeNull()
  })
})
