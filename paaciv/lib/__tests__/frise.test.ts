import { describe, it, expect } from 'vitest'
import {
  anneeEdifice, bornesFrise, positionRelative, pasGraduation, graduations,
  repartirVoies, segmentsEpoques, type EpoqueBornee,
} from '@/lib/frise'

const EPOQUES: EpoqueBornee[] = [
  { id: 'precolonial', nom_fr: 'Précolonial', nom_en: null, couleur: '#6B5A3C', annee_min: null, annee_max: 1892 },
  { id: 'colonial', nom_fr: 'Colonial', nom_en: null, couleur: '#9E4A2C', annee_min: 1893, annee_max: 1959 },
  { id: 'post', nom_fr: 'Post-indépendance', nom_en: null, couleur: '#35655F', annee_min: 1960, annee_max: null },
]

describe('anneeEdifice', () => {
  it("préfère l'année de début à l'année de fin", () => {
    expect(anneeEdifice({ annee_debut: 1963, annee_fin: 1970, date_texte: '1985' })).toBe(1963)
  })

  it("retombe sur l'année de fin quand le début manque", () => {
    expect(anneeEdifice({ annee_debut: null, annee_fin: 1970, date_texte: null })).toBe(1970)
  })

  it('lit un millésime dans le texte libre en dernier recours', () => {
    expect(anneeEdifice({ annee_debut: null, annee_fin: null, date_texte: 'achevé en 1957' })).toBe(1957)
  })

  it("rend null quand le texte ne porte aucun millésime — l'édifice sort de la frise plutôt que d'y être placé au hasard", () => {
    expect(anneeEdifice({ annee_debut: null, annee_fin: null, date_texte: 'fin XIXᵉ – début XXᵉ' })).toBeNull()
  })

  it('écarte un nombre de quatre chiffres qui ne peut pas être une année', () => {
    // Sans la borne haute, une coquille de saisie écraserait toute l'échelle
    // de l'axe en tirant une extrémité à l'an 9000.
    expect(anneeEdifice({ annee_debut: null, annee_fin: null, date_texte: 'parcelle 9000' }, 2026)).toBeNull()
    expect(anneeEdifice({ annee_debut: null, annee_fin: null, date_texte: 'lot 0042' })).toBeNull()
  })

  it('prend le premier millésime plausible et ignore les nombres qui le précèdent', () => {
    expect(anneeEdifice({ annee_debut: null, annee_fin: null, date_texte: 'lot 0042, bâti en 1912' })).toBe(1912)
  })
})

describe('bornesFrise', () => {
  it('arrondit à la décennie et laisse une marge en amont du plus ancien édifice', () => {
    expect(bornesFrise([1893, 1963, 1990])).toEqual({ min: 1870, max: 2000 })
  })

  it('ne produit jamais un intervalle nul, même sur une seule année', () => {
    const b = bornesFrise([1963], 0)
    expect(b.max).toBeGreaterThan(b.min)
  })

  it('rend des bornes utilisables sur un corpus vide', () => {
    const b = bornesFrise([])
    expect(b.max).toBeGreaterThan(b.min)
  })
})

describe('positionRelative', () => {
  it('place les bornes à 0 et 1', () => {
    const b = { min: 1900, max: 2000 }
    expect(positionRelative(1900, b)).toBe(0)
    expect(positionRelative(2000, b)).toBe(1)
    expect(positionRelative(1950, b)).toBeCloseTo(0.5)
  })
})

describe('graduations', () => {
  it('resserre le pas sur un axe court', () => {
    expect(pasGraduation({ min: 1960, max: 2000 })).toBe(10)
  })

  it("élargit le pas plutôt que de saturer l'axe de traits", () => {
    expect(pasGraduation({ min: 1500, max: 2000 })).toBeGreaterThanOrEqual(50)
    expect(graduations({ min: 1500, max: 2000 }).length).toBeLessThanOrEqual(14)
  })

  it('ne gradue jamais hors des bornes', () => {
    const b = { min: 1873, max: 2004 }
    for (const a of graduations(b)) {
      expect(a).toBeGreaterThanOrEqual(b.min)
      expect(a).toBeLessThanOrEqual(b.max)
    }
  })
})

describe('repartirVoies', () => {
  it('garde une seule voie quand les points sont assez espacés', () => {
    expect(repartirVoies([0, 200, 400], 150)).toEqual([0, 0, 0])
  })

  it('descend un point qui chevaucherait son voisin', () => {
    expect(repartirVoies([0, 40], 150)).toEqual([0, 1])
  })

  it('remonte en voie 0 dès que la place est de nouveau libre', () => {
    // 0 et 20 se gênent ; 400 est loin des deux, il reprend la voie du haut.
    expect(repartirVoies([0, 20, 400], 150)).toEqual([0, 1, 0])
  })

  it('rend un résultat aligné sur l’ordre D’ENTRÉE, pas sur l’ordre trié', () => {
    // Le composant lit `voies[i]` en parcourant sa propre liste : une sortie
    // triée décalerait chaque étiquette d'un cran par rapport à son point.
    expect(repartirVoies([400, 0, 20], 150)).toEqual([0, 0, 1])
  })

  it("n'ouvre jamais deux voies là où une suffit, sur un grand corpus", () => {
    const x = Array.from({ length: 200 }, (_, i) => i * 160)
    expect(Math.max(...repartirVoies(x, 150))).toBe(0)
  })

  it('empile autant de voies que nécessaire sur des points confondus', () => {
    expect(repartirVoies([10, 10, 10], 150)).toEqual([0, 1, 2])
  })
})

describe('segmentsEpoques', () => {
  it('rogne les périodes ouvertes aux bornes de l’axe', () => {
    const s = segmentsEpoques(EPOQUES, { min: 1870, max: 2000 })
    expect(s.map((x) => x.epoque.id)).toEqual(['precolonial', 'colonial', 'post'])
    expect(s[0].debut).toBe(0)
    expect(s[2].fin).toBe(1)
  })

  it('écarte une époque entièrement hors cadre plutôt que de la dessiner à largeur nulle', () => {
    const s = segmentsEpoques(EPOQUES, { min: 1960, max: 2000 })
    expect(s.map((x) => x.epoque.id)).toEqual(['post'])
  })

  it('rend des segments qui se suivent sans trou ni recouvrement', () => {
    const s = segmentsEpoques(EPOQUES, { min: 1870, max: 2000 })
    for (let i = 1; i < s.length; i++) {
      // Les bornes en base sont 1892 / 1893 : un an d'écart, soit la largeur
      // d'un an sur l'axe. On vérifie qu'il n'y a ni recouvrement ni béance.
      expect(s[i].debut).toBeGreaterThanOrEqual(s[i - 1].fin)
      expect(s[i].debut - s[i - 1].fin).toBeLessThan(0.02)
    }
  })
})
