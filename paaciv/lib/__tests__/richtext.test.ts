import { describe, it, expect } from 'vitest'
import { assainirHtml } from '@/lib/richtext'

describe('assainirHtml', () => {
  it('supprime les scripts (balise et contenu)', () => {
    const out = assainirHtml('<p>Bonjour</p><script>alert(1)</script>')
    expect(out).toContain('<p>Bonjour</p>')
    expect(out).not.toContain('script')
    expect(out).not.toContain('alert(1)')
  })

  it('supprime les gestionnaires on*', () => {
    const out = assainirHtml('<p onclick="evil()">x</p>')
    expect(out).not.toContain('onclick')
    expect(out).toContain('x')
  })

  it('neutralise un href javascript:', () => {
    const out = assainirHtml('<a href="javascript:alert(1)">lien</a>')
    expect(out).not.toContain('javascript:')
  })

  it('conserve le formatage autorisé', () => {
    const out = assainirHtml('<h2>T</h2><strong>gras</strong><ul><li>a</li></ul>')
    expect(out).toContain('<h2>T</h2>')
    expect(out).toContain('<strong>gras</strong>')
    expect(out).toContain('<li>a</li>')
  })

  it('force rel et target sur les liens', () => {
    const out = assainirHtml('<a href="https://x.test">y</a>')
    expect(out).toContain('rel="noopener nofollow"')
    expect(out).toContain('target="_blank"')
  })

  it('entrée nulle ou vide → chaîne vide', () => {
    expect(assainirHtml(null)).toBe('')
    expect(assainirHtml(undefined)).toBe('')
    expect(assainirHtml('')).toBe('')
  })
})
