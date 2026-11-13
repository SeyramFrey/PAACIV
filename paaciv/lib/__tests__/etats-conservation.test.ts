import { describe, it, expect } from 'vitest'
import {
  ETATS_CONSERVATION,
  ETATS_MENACES,
  estEtatConservation,
  etatOuNull,
  filtreEtatOuNull,
  etatsDuFiltre,
} from '@/lib/etats-conservation'
import { ETATS_OCCUPATION, occupationOuNull } from '@/lib/etats-occupation'
import { GROUPES_IMAGE, estGroupeImage } from '@/lib/groupes-image'

describe('etats-conservation', () => {
  // Le vocabulaire est aussi une contrainte `check` en base (migration 0036).
  // Ce test est le témoin qui rend visible une divergence entre les deux
  // moitiés : le modifier sans migration correspondante doit se remarquer ici,
  // et non en production sur une violation de contrainte Postgres.
  it('fige exactement les cinq valeurs de la contrainte 0036, du meilleur au pire', () => {
    expect([...ETATS_CONSERVATION]).toEqual([
      'bon_etat',
      'etat_moyen',
      'degrade',
      'fortement_degrade',
      'ruine',
    ])
  })

  it('reconnaît les valeurs du vocabulaire', () => {
    for (const e of ETATS_CONSERVATION) expect(estEtatConservation(e)).toBe(true)
  })

  it('rejette ce qui n’en fait pas partie, dont l’ancien vocabulaire de 0023', () => {
    for (const v of ['intact', 'en_danger', 'demoli', 'Bon état', 'bon etat', '', 'ruines']) {
      expect(estEtatConservation(v)).toBe(false)
    }
  })

  it('rejette ce qui n’est pas une chaîne', () => {
    for (const v of [null, undefined, 42, {}, ['bon_etat']]) {
      expect(estEtatConservation(v)).toBe(false)
    }
  })

  describe('etatOuNull', () => {
    it('normalise une valeur du vocabulaire', () => {
      expect(etatOuNull('degrade')).toBe('degrade')
    })

    it('tolère les espaces autour — un paramètre d’URL recopié à la main', () => {
      expect(etatOuNull('  ruine  ')).toBe('ruine')
    })

    it('renvoie null hors vocabulaire plutôt que de laisser passer la valeur', () => {
      expect(etatOuNull('en_danger')).toBeNull()
      expect(etatOuNull('nimporte-quoi')).toBeNull()
      // Le groupe n'est pas un état : il ne s'écrit jamais en base.
      expect(etatOuNull('menace')).toBeNull()
    })

    it('renvoie null sur une absence de valeur', () => {
      expect(etatOuNull(null)).toBeNull()
      expect(etatOuNull(undefined)).toBeNull()
      expect(etatOuNull('')).toBeNull()
      expect(etatOuNull('   ')).toBeNull()
    })
  })

  describe('filtre de groupe « menacé »', () => {
    it('regroupe dégradé et fortement dégradé, sans le ruiné', () => {
      expect([...ETATS_MENACES]).toEqual(['degrade', 'fortement_degrade'])
      expect(etatsDuFiltre('menace')).toEqual(['degrade', 'fortement_degrade'])
    })

    it('un état seul ne filtre que lui', () => {
      expect(etatsDuFiltre('ruine')).toEqual(['ruine'])
    })

    it('accepte un état ou le groupe, et rien d’autre', () => {
      expect(filtreEtatOuNull('menace')).toBe('menace')
      expect(filtreEtatOuNull('bon_etat')).toBe('bon_etat')
      expect(filtreEtatOuNull('en_danger')).toBeNull()
    })
  })
})

describe('etats-occupation', () => {
  it('fige les quatre valeurs de la contrainte 0036', () => {
    expect([...ETATS_OCCUPATION]).toEqual(['occupe', 'partiellement_occupe', 'vacant', 'abandonne'])
  })

  it('renvoie null hors vocabulaire', () => {
    expect(occupationOuNull(' vacant ')).toBe('vacant')
    expect(occupationOuNull('Occupé')).toBeNull()
    expect(occupationOuNull(null)).toBeNull()
  })
})

describe('groupes-image', () => {
  it('fige les trois emplacements de la contrainte 0036', () => {
    expect([...GROUPES_IMAGE]).toEqual(['galerie', 'etat_actuel', 'documentation'])
    expect(estGroupeImage('documentation')).toBe(true)
    expect(estGroupeImage('archives')).toBe(false)
  })
})
