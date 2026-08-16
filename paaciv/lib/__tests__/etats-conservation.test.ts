import { describe, it, expect } from 'vitest'
import {
  ETATS_CONSERVATION,
  estEtatConservation,
  etatOuNull,
} from '@/lib/etats-conservation'

describe('etats-conservation', () => {
  // Le vocabulaire est aussi une contrainte `check` en base (migration 0023).
  // Ce test est le témoin qui rend visible une divergence entre les deux
  // moitiés : le modifier sans migration correspondante doit se remarquer ici,
  // et non en production sur une violation de contrainte Postgres.
  it('fige exactement les quatre valeurs de la contrainte 0023', () => {
    expect([...ETATS_CONSERVATION]).toEqual([
      'intact',
      'en_restauration',
      'en_danger',
      'demoli',
    ])
  })

  it('reconnaît les valeurs du vocabulaire', () => {
    for (const e of ETATS_CONSERVATION) expect(estEtatConservation(e)).toBe(true)
  })

  it('rejette ce qui n’en fait pas partie', () => {
    // « en danger » avec une espace et « Intact » capitalisé sont exactement
    // les formes que le champ texte libre laissait entrer avant 0023.
    for (const v of ['en danger', 'Intact', 'ruine', '', 'demolis']) {
      expect(estEtatConservation(v)).toBe(false)
    }
  })

  it('rejette ce qui n’est pas une chaîne', () => {
    for (const v of [null, undefined, 42, {}, ['intact']]) {
      expect(estEtatConservation(v)).toBe(false)
    }
  })

  describe('etatOuNull', () => {
    it('normalise une valeur du vocabulaire', () => {
      expect(etatOuNull('en_danger')).toBe('en_danger')
    })

    it('tolère les espaces autour — un paramètre d’URL recopié à la main', () => {
      expect(etatOuNull('  demoli  ')).toBe('demoli')
    })

    it('renvoie null hors vocabulaire plutôt que de laisser passer la valeur', () => {
      // À l'écriture, laisser passer produirait une violation de contrainte
      // Postgres brute côté éditeur ; à la lecture, un filtre sur une
      // catégorie inexistante — donc une archive vide sans explication.
      expect(etatOuNull('en danger')).toBeNull()
      expect(etatOuNull('nimporte-quoi')).toBeNull()
    })

    it('renvoie null sur une absence de valeur', () => {
      expect(etatOuNull(null)).toBeNull()
      expect(etatOuNull(undefined)).toBeNull()
      expect(etatOuNull('')).toBeNull()
      expect(etatOuNull('   ')).toBeNull()
    })
  })
})
