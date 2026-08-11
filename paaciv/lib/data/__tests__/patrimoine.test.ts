import { describe, it, expect } from 'vitest'
import {
  mapLiaisonsArchitectes,
  filtrerContenusPublies,
  type LiaisonArchitecte,
  type ContenuLieRow,
} from '@/lib/data/patrimoine'

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

  it('trie les architectes par nom, quel que soit l’ordre reçu', () => {
    const liaisons: LiaisonArchitecte[] = [
      { role: null, architectes: { slug: 'z', nom: 'Zoé Kouassi', statut: 'publie' } },
      { role: 'Architecte principal', architectes: { slug: 'pierre-fakhoury', nom: 'Pierre Fakhoury', statut: 'publie' } },
      { role: null, architectes: { slug: 'a', nom: 'Aya Bamba', statut: 'publie' } },
    ]
    expect(mapLiaisonsArchitectes(liaisons).map((a) => a.nom)).toEqual([
      'Aya Bamba',
      'Pierre Fakhoury',
      'Zoé Kouassi',
    ])
  })
})

describe('filtrerContenusPublies', () => {
  it('exclut une ligne brouillon (le piège BROUILLON du seed) et conserve la publiée', () => {
    const rows: ContenuLieRow[] = [
      { slug: 'article-brouillon', titre_fr: 'Article BROUILLON — ne pas publier', titre_en: null, statut: 'brouillon' },
      { slug: 'pyramide-abidjan-histoire', titre_fr: 'X', titre_en: null, statut: 'publie' },
    ]
    expect(filtrerContenusPublies(rows)).toEqual([
      { slug: 'pyramide-abidjan-histoire', titre_fr: 'X', titre_en: null },
    ])
  })

  it('ne renvoie pas le champ statut dans le résultat', () => {
    const rows: ContenuLieRow[] = [
      { slug: 'x', titre_fr: 'X', titre_en: 'X-en', statut: 'publie' },
    ]
    expect(filtrerContenusPublies(rows)).toEqual([{ slug: 'x', titre_fr: 'X', titre_en: 'X-en' }])
  })

  it('tableau nul, absent ou vide → []', () => {
    expect(filtrerContenusPublies(null)).toEqual([])
    expect(filtrerContenusPublies(undefined)).toEqual([])
    expect(filtrerContenusPublies([])).toEqual([])
  })
})
