import { describe, it, expect } from 'vitest'
import { texteOuNull, intOuNull, richeOuNull, validerCoordonnee, BORNE_LAT, BORNE_LNG } from '@/lib/admin/champs'

describe('texteOuNull', () => {
  it('convertit une valeur vide ou blanche en null', () => {
    expect(texteOuNull('')).toBeNull()
    expect(texteOuNull('   ')).toBeNull()
    expect(texteOuNull(null)).toBeNull()
  })

  it('recadre les espaces superflus', () => {
    expect(texteOuNull('  Pierre Fakhoury  ')).toBe('Pierre Fakhoury')
  })
})

describe('intOuNull', () => {
  it('convertit une valeur vide en null', () => {
    expect(intOuNull('')).toBeNull()
    expect(intOuNull(null)).toBeNull()
  })

  it('parse un entier', () => {
    expect(intOuNull('1943')).toBe(1943)
  })

  it('une valeur non numérique devient null (pas NaN)', () => {
    expect(intOuNull('abc')).toBeNull()
  })
})

describe('validerCoordonnee', () => {
  it('un champ vide reste une absence de point (null), pas une erreur', () => {
    expect(validerCoordonnee('', BORNE_LAT)).toEqual({ ok: true, valeur: null })
    expect(validerCoordonnee('   ', BORNE_LAT)).toEqual({ ok: true, valeur: null })
    expect(validerCoordonnee(null, BORNE_LAT)).toEqual({ ok: true, valeur: null })
  })

  it('accepte une coordonnée ivoirienne plausible', () => {
    expect(validerCoordonnee('7.69', BORNE_LAT)).toEqual({ ok: true, valeur: 7.69 })
    expect(validerCoordonnee('-5.03', BORNE_LNG)).toEqual({ ok: true, valeur: -5.03 })
  })

  it('refuse les latitudes qui ont cassé la carte publique (lat 5000 et 725)', () => {
    expect(validerCoordonnee('5000', BORNE_LAT)).toEqual({ ok: false })
    expect(validerCoordonnee('725', BORNE_LAT)).toEqual({ ok: false })
  })

  it('bornes incluses, hors bornes refusé', () => {
    expect(validerCoordonnee('90', BORNE_LAT)).toEqual({ ok: true, valeur: 90 })
    expect(validerCoordonnee('-90', BORNE_LAT)).toEqual({ ok: true, valeur: -90 })
    expect(validerCoordonnee('90.0001', BORNE_LAT)).toEqual({ ok: false })
    expect(validerCoordonnee('-90.0001', BORNE_LAT)).toEqual({ ok: false })
  })

  it('la longitude est bornée plus large que la latitude', () => {
    expect(validerCoordonnee('150', BORNE_LNG)).toEqual({ ok: true, valeur: 150 })
    expect(validerCoordonnee('150', BORNE_LAT)).toEqual({ ok: false })
    expect(validerCoordonnee('180.5', BORNE_LNG)).toEqual({ ok: false })
  })

  it('une valeur non numérique est refusée, jamais convertie en NaN ni en null silencieux', () => {
    expect(validerCoordonnee('abc', BORNE_LAT)).toEqual({ ok: false })
    expect(validerCoordonnee('7,69', BORNE_LAT)).toEqual({ ok: false })
    expect(validerCoordonnee('Infinity', BORNE_LAT)).toEqual({ ok: false })
  })
})

describe('richeOuNull', () => {
  it('assainit le HTML avant enregistrement (retire les scripts)', () => {
    const out = richeOuNull('<p>Bio</p><script>alert(1)</script>')
    expect(out).toBe('<p>Bio</p>')
  })

  it('neutralise un gestionnaire onerror injecté', () => {
    const out = richeOuNull('<p onerror="evil()">x</p>')
    expect(out).not.toContain('onerror')
  })

  it('un contenu vide après assainissement devient null', () => {
    expect(richeOuNull('<script>alert(1)</script>')).toBeNull()
    expect(richeOuNull('')).toBeNull()
    expect(richeOuNull(null)).toBeNull()
  })
})
