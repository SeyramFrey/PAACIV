import { describe, expect, it } from 'vitest'
import { carteAuSommet, ecartCarte, estLienInstagram } from '@/lib/reels'

describe('roue des réels', () => {
  it('place la carte de la position au sommet, les autres de part et d’autre', () => {
    expect(ecartCarte(2, 2, 7)).toBe(0)
    expect(ecartCarte(3, 2, 7)).toBe(1)
    expect(ecartCarte(0, 2, 7)).toBe(-2)
  })

  it('boucle : la dernière carte revient à gauche de la première', () => {
    expect(ecartCarte(6, 0, 7)).toBe(-1)
    expect(ecartCarte(0, 6, 7)).toBe(1)
    // Une position fractionnaire, pendant un glisser.
    expect(ecartCarte(0, 6.5, 7)).toBeCloseTo(0.5)
  })

  it('reste dans [-n/2, n/2) même pour une position négative ou au-delà du paquet', () => {
    for (const p of [-9.3, -1, 0, 4.2, 15]) {
      for (let i = 0; i < 5; i++) {
        const d = ecartCarte(i, p, 5)
        expect(d).toBeGreaterThanOrEqual(-2.5)
        expect(d).toBeLessThan(2.5)
      }
    }
  })

  it('donne la carte au sommet pour toute position', () => {
    expect(carteAuSommet(0, 4)).toBe(0)
    expect(carteAuSommet(2.6, 4)).toBe(3)
    expect(carteAuSommet(-1, 4)).toBe(3)
    expect(carteAuSommet(9, 4)).toBe(1)
    expect(carteAuSommet(3, 0)).toBe(0)
  })
})

describe('lien de post Instagram', () => {
  it('accepte un post ou un réel instagram.com en https', () => {
    expect(estLienInstagram('https://www.instagram.com/reel/C8abc123/')).toBe(true)
    expect(estLienInstagram('https://instagram.com/p/C8abc123/')).toBe(true)
  })

  it('refuse tout autre domaine, le http et le vide', () => {
    expect(estLienInstagram('http://www.instagram.com/reel/x/')).toBe(false)
    expect(estLienInstagram('https://www.instagram.com.example.org/reel/x')).toBe(false)
    expect(estLienInstagram('https://www.youtube.com/watch?v=x')).toBe(false)
    expect(estLienInstagram('')).toBe(false)
    expect(estLienInstagram(null)).toBe(false)
  })
})
