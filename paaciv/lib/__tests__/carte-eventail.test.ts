import { describe, expect, it } from 'vitest'
import {
  ECART_EVENTAIL,
  RAYON_MIN_EVENTAIL,
  doitOuvrirEventail,
  positionsEventail,
  progressionEventail,
} from '@/lib/carte-eventail'

const distance = ([ax, ay]: [number, number], [bx, by]: [number, number]) => Math.hypot(ax - bx, ay - by)

describe('éventail des points confondus', () => {
  it('rend une position par point', () => {
    for (const n of [2, 3, 7, 12]) expect(positionsEventail(n)).toHaveLength(n)
  })

  it('écarte assez les points pour qu’aucun ne recouvre son voisin', () => {
    for (const n of [2, 3, 5, 8, 15, 40]) {
      const positions = positionsEventail(n)
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          expect(distance(positions[i], positions[j])).toBeGreaterThanOrEqual(ECART_EVENTAIL - 1e-9)
        }
      }
    }
  })

  it('laisse le centre dégagé, là où reste l’amas', () => {
    for (const n of [2, 3, 9, 30]) {
      for (const p of positionsEventail(n)) {
        expect(distance(p, [0, 0])).toBeGreaterThanOrEqual(RAYON_MIN_EVENTAIL - 1e-9)
      }
    }
  })

  it('ouvre le premier point en haut, à midi', () => {
    const [x, y] = positionsEventail(3)[0]
    expect(x).toBeCloseTo(0)
    expect(y).toBeLessThan(0)
  })

  it('ne s’ouvre que si zoomer ne séparerait plus les points', () => {
    // L'amas se scinde au zoom 13 : un zoom suffit, pas d'éventail.
    expect(doitOuvrirEventail(13, 17)).toBe(false)
    expect(doitOuvrirEventail(17, 17)).toBe(false)
    // Points confondus : MapLibre répond « au-delà du dernier zoom d'amas ».
    expect(doitOuvrirEventail(18, 17)).toBe(true)
  })

  it('déploie en douceur, de 0 à 1, sans dépasser', () => {
    expect(progressionEventail(0)).toBe(0)
    expect(progressionEventail(1)).toBe(1)
    expect(progressionEventail(2)).toBe(1)
    expect(progressionEventail(-1)).toBe(0)
    // Sortie rapide puis ralentie : à mi-course, plus de la moitié du chemin.
    expect(progressionEventail(0.5)).toBeGreaterThan(0.5)
  })
})
