import { cache } from 'react'
import { createReadClient } from '@/lib/supabase/reader'
import { imageUrl } from '@/lib/media'

export type EvenementListItem = {
  id: string
  slug: string
  titre_fr: string
  titre_en: string | null
  image: string | null
  lieu: string | null
  date_debut: string
  date_fin: string | null
}

export type EvenementDetail = EvenementListItem & {
  description_fr: string | null
  description_en: string | null
}

const SELECT_LISTE = 'id, slug, titre_fr, titre_en, image, lieu, date_debut, date_fin'

const SELECT_DETAIL = `${SELECT_LISTE}, description_fr, description_en`

function imageEvenementUrl(chemin: string | null): string | null {
  return chemin ? imageUrl(chemin) : null
}

type EvenementListRow = Omit<EvenementListItem, 'image'> & { image: string | null }

function mapEvenementListItem(row: EvenementListRow): EvenementListItem {
  const { image, ...reste } = row
  return { ...reste, image: imageEvenementUrl(image) }
}

// Pas de tri en SQL : `partitionnerEvenements` ordonne les deux sections
// (à venir croissant, passés décroissant) au moment du rendu.
export async function listeEvenements(): Promise<EvenementListItem[]> {
  const sb = createReadClient()
  const { data, error } = await sb.from('evenements').select(SELECT_LISTE).eq('statut', 'publie')
  if (error) throw error
  return ((data ?? []) as unknown as EvenementListRow[]).map(mapEvenementListItem)
}

type EvenementDetailRow = EvenementListRow & {
  description_fr: string | null
  description_en: string | null
}

export async function getEvenementParSlug(slug: string): Promise<EvenementDetail | null> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('evenements')
    .select(SELECT_DETAIL)
    .eq('slug', slug)
    .eq('statut', 'publie')
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const row = data as unknown as EvenementDetailRow
  const { description_fr, description_en, ...reste } = row
  return {
    ...mapEvenementListItem(reste),
    description_fr,
    description_en,
  }
}

// Mémoïsé par requête (React.cache) : `generateMetadata` et le composant de
// page appellent tous deux le chargement de la fiche — sans ce cache, ce
// serait deux allers-retours BDD identiques par requête.
export const getEvenementParSlugCache = cache(getEvenementParSlug)
