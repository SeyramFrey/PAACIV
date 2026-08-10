import { describe, it, expect } from 'vitest'
import { texteOuNull, intOuNull, richeOuNull } from '@/lib/admin/champs'

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
