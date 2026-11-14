import { describe, it, expect } from 'vitest'
import { heureAbidjan, minuteCourante, delaiAvantMinute } from '@/lib/heure-abidjan'

describe('heureAbidjan', () => {
  it('donne l’heure d’Abidjan (UTC+0), quel que soit le fuseau du visiteur', () => {
    const instant = new Date('2026-11-14T16:20:45.000Z')
    expect(heureAbidjan(instant, 'fr')).toEqual({ texte: '16 h 20', iso: '16:20' })
    expect(heureAbidjan(instant, 'en')).toEqual({ texte: '16:20', iso: '16:20' })
  })

  it('n’a pas d’heure d’été : juillet reste à UTC+0', () => {
    expect(heureAbidjan(new Date('2026-07-01T09:05:00.000Z'), 'fr').texte).toBe('9 h 05')
  })

  it('écrit minuit 0 h en français et 00:00 en anglais', () => {
    const minuit = new Date('2026-11-14T00:00:00.000Z')
    expect(heureAbidjan(minuit, 'fr').texte).toBe('0 h 00')
    expect(heureAbidjan(minuit, 'en').texte).toBe('00:00')
    expect(heureAbidjan(minuit, 'en').iso).toBe('00:00')
  })
})

describe('minuteCourante et delaiAvantMinute', () => {
  it('ne change de valeur qu’à la minute pleine', () => {
    const t = Date.parse('2026-11-14T16:20:00.000Z')
    expect(minuteCourante(t)).toBe(minuteCourante(t + 59_999))
    expect(minuteCourante(t + 60_000)).toBe(minuteCourante(t) + 1)
  })

  it('compte le délai jusqu’à la prochaine minute', () => {
    const t = Date.parse('2026-11-14T16:20:45.000Z')
    expect(delaiAvantMinute(t)).toBe(15_000)
    expect(delaiAvantMinute(Date.parse('2026-11-14T16:21:00.000Z'))).toBe(60_000)
  })
})
