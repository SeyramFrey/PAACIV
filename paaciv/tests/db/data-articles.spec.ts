import { test, expect } from '@playwright/test'
import { listeArticles, getArticleParSlug } from '@/lib/data/articles'

test('listeArticles ne renvoie que des publiés, triés du plus récent au plus ancien', async () => {
  const items = await listeArticles()
  expect(items.length).toBeGreaterThan(0)
  expect(items.some((a) => a.slug === 'article-brouillon')).toBe(false)
  const dates = items.map((a) => a.date_publication)
  expect([...dates].sort().reverse()).toEqual(dates)   // échoue si le tri est retiré
})

test('listeArticles filtre par catégorie', async () => {
  const tous = await listeArticles()
  const filtres = await listeArticles('histoires')
  expect(filtres.length).toBeGreaterThan(0)
  expect(filtres.length).toBeLessThan(tous.length)     // le seed contient d'autres catégories
  expect(filtres.every((a) => a.categorie?.id === 'histoires')).toBe(true)
})

test('getArticleParSlug renvoie le détail, null pour un brouillon ou un slug inconnu', async () => {
  const a = await getArticleParSlug('pyramide-abidjan-histoire')
  expect(a).not.toBeNull()
  expect(a!.patrimoine).not.toBeNull()
  expect(await getArticleParSlug('article-brouillon')).toBeNull()
  expect(await getArticleParSlug('nexiste-pas')).toBeNull()
})
