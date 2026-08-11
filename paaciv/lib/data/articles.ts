import { cache } from 'react'
import { createReadClient } from '@/lib/supabase/reader'
import { imageUrl } from '@/lib/media'
import { mapPatrimoineLie, type PatrimoineLie, type PatrimoineLieRow } from '@/lib/data/patrimoine-lie'

export type CategorieArticle = { id: string; nom_fr: string; nom_en: string | null }

export type ArticleListItem = {
  id: string
  slug: string
  titre_fr: string
  titre_en: string | null
  chapo_fr: string | null
  chapo_en: string | null
  image: string | null
  categorie: CategorieArticle | null
  date_publication: string
}

export type ArticleDetail = ArticleListItem & {
  corps_fr: string | null
  corps_en: string | null
  patrimoine: PatrimoineLie | null
}

const SELECT_LISTE =
  'id, slug, titre_fr, titre_en, chapo_fr, chapo_en, image_couverture, date_publication, categorie:categories_article(id, nom_fr, nom_en)'

const SELECT_DETAIL = `${SELECT_LISTE}, corps_fr, corps_en, patrimoine:patrimoine(slug, titre_fr, titre_en, statut)`

function couvertureUrl(chemin: string | null): string | null {
  return chemin ? imageUrl(chemin) : null
}

type ArticleListRow = Omit<ArticleListItem, 'image' | 'categorie'> & {
  image_couverture: string | null
  categorie: CategorieArticle | null
}

function mapArticleListItem(row: ArticleListRow): ArticleListItem {
  const { image_couverture, ...reste } = row
  return { ...reste, image: couvertureUrl(image_couverture) }
}

export async function listeArticles(categorie?: string): Promise<ArticleListItem[]> {
  const sb = createReadClient()
  let requete = sb
    .from('articles')
    .select(SELECT_LISTE)
    .eq('statut', 'publie')
    .order('date_publication', { ascending: false })
  if (categorie) requete = requete.eq('categorie_id', categorie)
  const { data, error } = await requete
  if (error) throw error
  return ((data ?? []) as unknown as ArticleListRow[]).map(mapArticleListItem)
}

type ArticleDetailRow = ArticleListRow & {
  corps_fr: string | null
  corps_en: string | null
  patrimoine: PatrimoineLieRow
}

export async function getArticleParSlug(slug: string): Promise<ArticleDetail | null> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('articles')
    .select(SELECT_DETAIL)
    .eq('slug', slug)
    .eq('statut', 'publie')
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const row = data as unknown as ArticleDetailRow
  const { corps_fr, corps_en, patrimoine, ...reste } = row
  return {
    ...mapArticleListItem(reste),
    corps_fr,
    corps_en,
    patrimoine: mapPatrimoineLie(patrimoine),
  }
}

// Mémoïsé par requête (React.cache) : `generateMetadata` et le composant de
// page appellent tous deux le chargement de la fiche — sans ce cache, ce
// serait deux allers-retours BDD identiques par requête.
export const getArticleParSlugCache = cache(getArticleParSlug)

export async function listeCategoriesArticle(): Promise<CategorieArticle[]> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('categories_article')
    .select('id, nom_fr, nom_en')
    .order('ordre', { ascending: true })
  if (error) throw error
  return (data ?? []) as CategorieArticle[]
}
