import { cache } from 'react'
import { createReadClient } from '@/lib/supabase/reader'
import { extraireIdYoutube, miniatureYoutube } from '@/lib/youtube'
import { mapPatrimoineLie, type PatrimoineLie, type PatrimoineLieRow } from '@/lib/data/patrimoine-lie'

export type ReportageListItem = {
  id: string
  slug: string
  titre_fr: string
  titre_en: string | null
  video_url: string
  date: string
  description_fr: string | null
  description_en: string | null
}

export type ReportageDetail = ReportageListItem & {
  patrimoine: PatrimoineLie | null
}

// La description est sélectionnée ici (et non ajoutée à part dans
// `SELECT_DETAIL`) : la carte « Film » de l'accueil (Task 10) affiche le
// dernier reportage via `listeReportages()`, pas `getReportageParSlug()`, et
// a besoin de ce résumé sans requête supplémentaire.
const SELECT_LISTE = 'id, slug, titre_fr, titre_en, video_url, date, description_fr, description_en'

const SELECT_DETAIL = `${SELECT_LISTE}, patrimoine:patrimoine(slug, titre_fr, titre_en, statut)`

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

// Le seed ne contient volontairement aucune URL non exploitable
// (cf. brief de la tâche), donc seul ce test unitaire prouve que
// l'extraction dégrade gracieusement (renvoie null) plutôt que de planter
// quand une URL stockée n'est pas une vidéo YouTube valide.
export function miniatureReportage(videoUrl: string): string | null {
  const id = extraireIdYoutube(videoUrl)
  return id ? miniatureYoutube(id) : null
}

type ReportageDetailRow = ReportageListItem & {
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
