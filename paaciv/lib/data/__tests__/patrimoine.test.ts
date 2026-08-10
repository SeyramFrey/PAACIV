import { describe, it, expect } from 'vitest'
import { mapLiaisonsArchitectes, type LiaisonArchitecte } from '@/lib/data/patrimoine'

describe('mapLiaisonsArchitectes', () => {
  it('exclut un architecte brouillon', () => {
    const liaisons: LiaisonArchitecte[] = [
      { role: 'Architecte principal', architectes: { slug: 'x', nom: 'X', statut: 'brouillon' } },
    ]
    expect(mapLiaisonsArchitectes(liaisons)).toEqual([])
  })

  it('conserve un architecte publié', () => {
    const liaisons: LiaisonArchitecte[] = [
      { role: 'Architecte principal', architectes: { slug: 'pierre-fakhoury', nom: 'Pierre Fakhoury', statut: 'publie' } },
    ]
    expect(mapLiaisonsArchitectes(liaisons)).toEqual([
      { slug: 'pierre-fakhoury', nom: 'Pierre Fakhoury', role: 'Architecte principal' },
    ])
  })

  it('conserve un role nul tel quel', () => {
    const liaisons: LiaisonArchitecte[] = [
      { role: null, architectes: { slug: 'y', nom: 'Y', statut: 'publie' } },
    ]
    expect(mapLiaisonsArchitectes(liaisons)).toEqual([{ slug: 'y', nom: 'Y', role: null }])
  })

  it('tableau nul, absent ou vide → []', () => {
    expect(mapLiaisonsArchitectes(null)).toEqual([])
    expect(mapLiaisonsArchitectes(undefined)).toEqual([])
    expect(mapLiaisonsArchitectes([])).toEqual([])
  })
})
