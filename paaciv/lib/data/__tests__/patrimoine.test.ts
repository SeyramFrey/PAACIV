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
      { role: 'Architecte principal', principal: false, architectes: { slug: 'x', nom: 'X', statut: 'brouillon' } },
    ]
    expect(mapLiaisonsArchitectes(liaisons)).toEqual([])
  })

  it('conserve un architecte publié', () => {
    const liaisons: LiaisonArchitecte[] = [
      { role: 'Architecte principal', principal: false, architectes: { slug: 'pierre-fakhoury', nom: 'Pierre Fakhoury', statut: 'publie' } },
    ]
    expect(mapLiaisonsArchitectes(liaisons)).toEqual([
      { slug: 'pierre-fakhoury', nom: 'Pierre Fakhoury', role: 'Architecte principal', principal: false },
    ])
  })

  it('conserve un role nul tel quel', () => {
    const liaisons: LiaisonArchitecte[] = [
      { role: null, principal: false, architectes: { slug: 'y', nom: 'Y', statut: 'publie' } },
    ]
    expect(mapLiaisonsArchitectes(liaisons)).toEqual([{ slug: 'y', nom: 'Y', role: null, principal: false }])
  })

  it('tableau nul, absent ou vide → []', () => {
    expect(mapLiaisonsArchitectes(null)).toEqual([])
    expect(mapLiaisonsArchitectes(undefined)).toEqual([])
    expect(mapLiaisonsArchitectes([])).toEqual([])
  })

  it('trie les architectes par nom, quel que soit l’ordre reçu', () => {
    const liaisons: LiaisonArchitecte[] = [
      { role: null, principal: false, architectes: { slug: 'z', nom: 'Zoé Kouassi', statut: 'publie' } },
      { role: 'Architecte principal', principal: false, architectes: { slug: 'pierre-fakhoury', nom: 'Pierre Fakhoury', statut: 'publie' } },
      { role: null, principal: false, architectes: { slug: 'a', nom: 'Aya Bamba', statut: 'publie' } },
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

describe('mapLiaisonsArchitectes — architecte principal', () => {
  it('remonte le principal en tête, quel que soit l’ordre alphabétique', () => {
    // Le principal s'appelle « Zoé » : sans le tri sur `principal`, il
    // finirait DERNIER. C'est ce qui rend l'assertion mordante — un tri resté
    // purement alphabétique la ferait échouer.
    const liaisons: LiaisonArchitecte[] = [
      { role: null, principal: false, architectes: { slug: 'a', nom: 'Aya Bamba', statut: 'publie' } },
      { role: 'architecte', principal: true, architectes: { slug: 'z', nom: 'Zoé Kouassi', statut: 'publie' } },
      { role: null, principal: false, architectes: { slug: 'm', nom: 'Michel Goly', statut: 'publie' } },
    ]
    expect(mapLiaisonsArchitectes(liaisons).map((a) => a.nom)).toEqual([
      'Zoé Kouassi',
      'Aya Bamba',
      'Michel Goly',
    ])
  })

  it('traite `principal: null` comme faux', () => {
    // PostgREST renvoie `null` plutôt que `false` sur une colonne jamais
    // renseignée par une vue ou un select partiel : sans la normalisation, le
    // tri comparerait `Number(null)` et `Number(false)`, tous deux 0, ce qui
    // marche par accident — mais le champ exposé vaudrait `null` au lieu d'un
    // booléen, et l'affichage `principal &&` deviendrait faux-négatif.
    const liaisons: LiaisonArchitecte[] = [
      { role: null, principal: null, architectes: { slug: 'a', nom: 'A', statut: 'publie' } },
    ]
    expect(mapLiaisonsArchitectes(liaisons)[0].principal).toBe(false)
  })
})
