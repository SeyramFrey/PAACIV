import { test, expect } from '@playwright/test'
import { listeReportages, getReportageParSlug } from '@/lib/data/reportages'
import { extraireIdYoutube } from '@/lib/youtube'

test('listeReportages ne renvoie que des publiés, avec des URL vidéo exploitables', async () => {
  const items = await listeReportages()
  expect(items.length).toBeGreaterThan(0)
  expect(items.some((r) => r.slug === 'reportage-brouillon')).toBe(false)
  expect(items.every((r) => extraireIdYoutube(r.video_url) !== null)).toBe(true)
})

test('listeReportages trie du plus récent au plus ancien', async () => {
  const items = await listeReportages()
  const dates = items.map((r) => r.date)
  expect([...dates].sort().reverse()).toEqual(dates)
})

test('getReportageParSlug : détail pour un publié, null pour un brouillon ou un slug inconnu', async () => {
  const r = await getReportageParSlug('visite-basilique')
  expect(r).not.toBeNull()
  expect(r!.patrimoine).not.toBeNull()
  expect(await getReportageParSlug('reportage-brouillon')).toBeNull()
  expect(await getReportageParSlug('nexiste-pas')).toBeNull()
})
