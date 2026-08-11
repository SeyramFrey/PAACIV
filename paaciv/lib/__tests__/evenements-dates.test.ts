import { describe, expect, it } from 'vitest'
import { partitionnerEvenements } from '@/lib/evenements-dates'

const REF = new Date('2026-06-15T12:00:00Z')
const e = (slug: string, date_debut: string, date_fin: string | null = null) => ({ slug, date_debut, date_fin })

describe('partitionnerEvenements', () => {
  it('sépare à venir et passés autour de la date de référence', () => {
    const { aVenir, passes } = partitionnerEvenements(
      [e('futur', '2026-07-01'), e('vieux', '2026-01-10'), e('proche', '2026-06-20')],
      REF,
    )
    expect(aVenir.map((x) => x.slug)).toEqual(['proche', 'futur']) // croissant
    expect(passes.map((x) => x.slug)).toEqual(['vieux'])
  })

  it('trie les passés du plus récent au plus ancien', () => {
    const { passes } = partitionnerEvenements([e('a', '2026-01-10'), e('b', '2026-05-01')], REF)
    expect(passes.map((x) => x.slug)).toEqual(['b', 'a'])
  })

  it('utilise date_fin quand elle existe : un événement en cours est « à venir »', () => {
    const { aVenir } = partitionnerEvenements([e('encours', '2026-06-01', '2026-06-30')], REF)
    expect(aVenir.map((x) => x.slug)).toEqual(['encours'])
  })

  it('considère le jour même comme non passé', () => {
    const { aVenir, passes } = partitionnerEvenements([e('aujourdhui', '2026-06-15')], REF)
    expect(aVenir).toHaveLength(1)
    expect(passes).toHaveLength(0)
  })
})
