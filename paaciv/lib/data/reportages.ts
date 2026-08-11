import { cache } from 'react'
import { createReadClient } from '@/lib/supabase/reader'
import { extraireIdYoutube, miniatureYoutube } from '@/lib/youtube'

export type ReportageListItem = {
  id: string
  slug: string
  titre_fr: string
  titre_en: string | null
  video_url: string
  date: string
}

export type PatrimoineLie = { slug: string; titre_fr: string; titre_en: string | null }

export type ReportageDetail = ReportageListItem & {
  description_fr: string | null
  description_en: string | null
  patrimoine: PatrimoineLie | null
}

const SELECT_LISTE = 'id, slug, titre_fr, titre_en, video_url, date'

const SELECT_DETAIL = `${SELECT_LISTE}, description_fr, description_en, patrimoine:patrimoine(slug, titre_fr, titre_en, statut)`

export async function listeReportages(): Promise<ReportageListItem[]> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('reportages')
    .select(SELECT_LISTE)
    .eq('statut', 'publie')
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as ReportageListItem[]
}

export type PatrimoineLieRow =
  | { slug: string; titre_fr: string; titre_en: string | null; statut: string }
  | null
  | undefined

// Le patrimoine lié n'est exposé côté public que s'il est lui-même publié.
// La RLS masque déjà la ligne côté anon, donc seul ce test unitaire prouve
// que le filtrage applicatif fait réellement son travail (c'est la leçon de
// la Phase 3 : un test d'intégration seul ne peut pas le prouver, RLS
// ferait passer le test même si ce filtre était supprimé).
export function mapPatrimoineLie(row: PatrimoineLieRow): PatrimoineLie | null {
  if (!row || row.statut !== 'publie') return null
  return { slug: row.slug, titre_fr: row.titre_fr, titre_en: row.titre_en }
}

// Idem : le seed ne contient volontairement aucune URL non exploitable
// (cf. brief de la tâche), donc seul ce test unitaire prouve que
// l'extraction dégrade gracieusement (renvoie null) plutôt que de planter
// quand une URL stockée n'est pas une vidéo YouTube valide.
export function miniatureReportage(videoUrl: string): string | null {
  const id = extraireIdYoutube(videoUrl)
  return id ? miniatureYoutube(id) : null
}

type ReportageDetailRow = ReportageListItem & {
  description_fr: string | null
  description_en: string | null
  patrimoine: PatrimoineLieRow
}

export async function getReportageParSlug(slug: string): Promise<ReportageDetail | null> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('reportages')
    .select(SELECT_DETAIL)
    .eq('slug', slug)
    .eq('statut', 'publie')
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const row = data as unknown as ReportageDetailRow
  const { patrimoine, ...reste } = row
  return {
    ...reste,
    patrimoine: mapPatrimoineLie(patrimoine),
  }
}

// Mémoïsé par requête (React.cache) : `generateMetadata` et le composant de
// page appellent tous deux le chargement de la fiche — sans ce cache, ce
// serait deux allers-retours BDD identiques par requête.
export const getReportageParSlugCache = cache(getReportageParSlug)
