import { cache } from 'react'
import { createReadClient } from '@/lib/supabase/reader'
import { imageUrl, imagePrincipale, type ImageMini } from '@/lib/media'

export type ArchitecteListItem = {
  id: string
  slug: string
  nom: string
  origine: 'ivoirien' | 'etranger'
  photo: string | null
  annee_naissance: number | null
  periode_texte: string | null
  ordre: number
}

export type RealisationLiee = {
  slug: string
  titre_fr: string
  titre_en: string | null
  image: string | null
  role: string | null
}

export type ArchitecteDetail = {
  id: string
  slug: string
  nom: string
  origine: 'ivoirien' | 'etranger'
  photo: string | null
  annee_naissance: number | null
  annee_deces: number | null
  periode_texte: string | null
  bio_fr: string | null
  bio_en: string | null
  parcours_fr: string | null
  parcours_en: string | null
  realisations_texte_fr: string | null
  realisations_texte_en: string | null
  realisations: RealisationLiee[]
}

function photoUrl(chemin: string | null): string | null {
  return chemin ? imageUrl(chemin) : null
}

export async function listeArchitectes(): Promise<ArchitecteListItem[]> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('architectes')
    .select('id, slug, nom, origine, photo, annee_naissance, periode_texte, ordre')
    .eq('statut', 'publie')
    .order('ordre', { ascending: true })
  if (error) throw error
  return ((data ?? []) as (Omit<ArchitecteListItem, 'photo'> & { photo: string | null })[]).map(
    (a) => ({ ...a, photo: photoUrl(a.photo) }),
  )
}

export type LiaisonRow = {
  role: string | null
  patrimoine: {
    slug: string
    titre_fr: string
    titre_en: string | null
    statut: string
    images: ImageMini[]
  } | null
}

type ArchitecteDetailRow = Omit<ArchitecteDetail, 'realisations'> & {
  patrimoine_architecte: LiaisonRow[]
}

// Une réalisation n'est exposée côté public que si le patrimoine lié est
// lui-même publié (l'architecte l'est déjà, filtré en amont par
// .eq('statut', 'publie')). Fonction pure exportée pour être testée sans
// base de données : c'est la seule barrière côté application qui filtre les
// patrimoines brouillon (la RLS filtre déjà la ligne de liaison elle-même,
// en défense en profondeur).
export function mapRealisationsLiees(
  liaisons: LiaisonRow[] | null | undefined,
): RealisationLiee[] {
  return (liaisons ?? [])
    .filter((l): l is LiaisonRow & { patrimoine: NonNullable<LiaisonRow['patrimoine']> } =>
      l.patrimoine !== null && l.patrimoine.statut === 'publie',
    )
    .map((l) => ({
      slug: l.patrimoine.slug,
      titre_fr: l.patrimoine.titre_fr,
      titre_en: l.patrimoine.titre_en,
      image: imagePrincipale(l.patrimoine.images),
      role: l.role,
    }))
    .sort((a, b) => a.titre_fr.localeCompare(b.titre_fr))
}

export async function getArchitecteParSlug(slug: string): Promise<ArchitecteDetail | null> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('architectes')
    .select(
      '*, patrimoine_architecte(role, patrimoine(slug, titre_fr, titre_en, statut, images(chemin, est_principale, ordre)))',
    )
    .eq('slug', slug)
    .eq('statut', 'publie')
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const row = data as unknown as ArchitecteDetailRow
  const realisations: RealisationLiee[] = mapRealisationsLiees(row.patrimoine_architecte)

  return {
    id: row.id,
    slug: row.slug,
    nom: row.nom,
    origine: row.origine,
    photo: photoUrl(row.photo),
    annee_naissance: row.annee_naissance,
    annee_deces: row.annee_deces,
    periode_texte: row.periode_texte,
    bio_fr: row.bio_fr,
    bio_en: row.bio_en,
    parcours_fr: row.parcours_fr,
    parcours_en: row.parcours_en,
    realisations_texte_fr: row.realisations_texte_fr,
    realisations_texte_en: row.realisations_texte_en,
    realisations,
  }
}

// Mémoïsé par requête (React.cache) : `generateMetadata` et le composant de
// page appellent tous deux le chargement de la fiche — sans ce cache, ce
// serait deux allers-retours BDD identiques par requête.
export const getArchitecteParSlugCache = cache(getArchitecteParSlug)
