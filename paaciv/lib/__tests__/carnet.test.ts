import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  analyserCarnet,
  ajouterTampon,
  lireCarnet,
  tamponner,
  effacerCarnet,
  abonnerCarnet,
  dateAbidjan,
  CLE_CARNET,
} from '@/lib/carnet'

describe('analyserCarnet', () => {
  it('rend un carnet vide sur une absence ou un contenu illisible', () => {
    expect(analyserCarnet(null)).toEqual([])
    expect(analyserCarnet('')).toEqual([])
    expect(analyserCarnet('pas du json')).toEqual([])
    expect(analyserCarnet('{"slug":"a"}')).toEqual([])
  })

  it('écarte les entrées mal formées et les doublons, garde les autres', () => {
    const brut = JSON.stringify([
      { slug: 'la-pyramide-abidjan', premiere: '2026-11-13T21:40:00.000Z' },
      { slug: 'la-pyramide-abidjan', premiere: '2026-11-14T08:00:00.000Z' },
      { slug: 'Majuscules', premiere: '2026-11-13T21:40:00.000Z' },
      { slug: 'sans-date' },
      { slug: 'date-fausse', premiere: 'hier' },
      42,
      { slug: 'basilique-yamoussoukro', premiere: '2026-11-13T22:00:00.000Z' },
    ])
    expect(analyserCarnet(brut)).toEqual([
      { slug: 'la-pyramide-abidjan', premiere: '2026-11-13T21:40:00.000Z' },
      { slug: 'basilique-yamoussoukro', premiere: '2026-11-13T22:00:00.000Z' },
    ])
  })
})

describe('ajouterTampon', () => {
  const quand = new Date('2026-11-13T21:40:00.000Z')

  it('pose un tampon daté de la première visite', () => {
    expect(ajouterTampon([], 'la-pyramide-abidjan', quand)).toEqual([
      { slug: 'la-pyramide-abidjan', premiere: '2026-11-13T21:40:00.000Z' },
    ])
  })

  it('ne repose pas un tampon déjà présent : la date de première visite ne bouge pas', () => {
    const carnet = ajouterTampon([], 'la-pyramide-abidjan', quand)
    expect(ajouterTampon(carnet, 'la-pyramide-abidjan', new Date('2026-12-01T10:00:00Z'))).toBe(carnet)
  })

  it('refuse un slug qui n’en est pas un', () => {
    const carnet: never[] = []
    expect(ajouterTampon(carnet, '../admin', quand)).toBe(carnet)
  })
})

describe('stockage local', () => {
  beforeEach(() => window.localStorage.clear())

  it('tamponner écrit, lireCarnet relit, effacerCarnet vide', () => {
    tamponner('la-pyramide-abidjan')
    tamponner('basilique-yamoussoukro')
    tamponner('la-pyramide-abidjan')
    expect(lireCarnet().map((t) => t.slug)).toEqual(['la-pyramide-abidjan', 'basilique-yamoussoukro'])
    effacerCarnet()
    expect(lireCarnet()).toEqual([])
    expect(window.localStorage.getItem(CLE_CARNET)).toBeNull()
  })

  it('renvoie le même objet tant que rien ne change (exigence de useSyncExternalStore)', () => {
    tamponner('la-pyramide-abidjan')
    expect(lireCarnet()).toBe(lireCarnet())
  })

  it('prévient les abonnés de l’onglet courant', () => {
    const rappel = vi.fn()
    const desabonner = abonnerCarnet(rappel)
    tamponner('la-pyramide-abidjan')
    expect(rappel).toHaveBeenCalledTimes(1)
    // Un second passage sur la même fiche n'écrit rien, donc ne prévient personne.
    tamponner('la-pyramide-abidjan')
    expect(rappel).toHaveBeenCalledTimes(1)
    desabonner()
    tamponner('basilique-yamoussoukro')
    expect(rappel).toHaveBeenCalledTimes(1)
  })
})

describe('dateAbidjan', () => {
  it('donne l’heure d’Abidjan (UTC+0), pas celle du visiteur', () => {
    const iso = '2026-11-13T21:40:00.000Z'
    expect(dateAbidjan(iso, 'fr')).toContain('21:40')
    expect(dateAbidjan(iso, 'fr')).toContain('novembre')
    expect(dateAbidjan(iso, 'en')).toContain('November')
  })
})
