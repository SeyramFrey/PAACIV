import { cache } from 'react'
import { createReadClient } from '@/lib/supabase/reader'
import { imageUrl } from '@/lib/media'

export type FiltresPatrimoine = {
  type?: string
  programme?: string
  district?: string
  epoque?: string
  q?: string
}

export type Ref = {
  id: string
  nom_fr: string
  nom_en: string | null
  couleur: string | null
  ordre: number | null
}

export type ImageRow = {
  id: string
  chemin: string
  legende_fr: string | null
  legende_en: string | null
  credit: string | null
  ordre: number
  est_principale: boolean
}

type ImageMini = { chemin: string; est_principale: boolean; ordre: number }

export type PatrimoineListItem = {
  id: string
  slug: string
  titre_fr: string
  titre_en: string | null
  resume_fr: string | null
  resume_en: string | null
  type_id: string | null
  programme_id: string | null
  district_id: string | null
  epoque_id: string | null
  ville: string | null
  images: ImageMini[]
}

export type PatrimoineDetail = {
  id: string
  slug: string
  titre_fr: string
  titre_en: string | null
  resume_fr: string | null
  resume_en: string | null
  description_fr: string | null
  description_en: string | null
  type_id: string | null
  programme_id: string | null
  date_texte: string | null
  annee_debut: number | null
  annee_fin: number | null
  epoque_id: string | null
  style_fr: string | null
  style_en: string | null
  lat: number | null
  lng: number | null
  district_id: string | null
  ville: string | null
  adresse_fr: string | null
  adresse_en: string | null
  statut_patrimonial: string | null
  etat_conservation: string | null
  video_url: string | null
  sources_fr: string | null
  sources_en: string | null
  statut: string
  type: Ref | null
  programme: Ref | null
  district: Ref | null
  epoque: Ref | null
  images: ImageRow[]
}

export type PointPublie = {
  id: string
  slug: string
  titre_fr: string
  titre_en: string | null
  type_id: string | null
  lat: number
  lng: number
  ville: string | null
  image: string | null
}

function imagePrincipale(images: ImageMini[] | null): string | null {
  if (!images || images.length === 0) return null
  const principale =
    images.find((i) => i.est_principale) ??
    [...images].sort((a, b) => a.ordre - b.ordre)[0]
  return principale ? imageUrl(principale.chemin) : null
}

function appliquerFiltres<T extends { eq: (c: string, v: string) => T; or: (s: string) => T }>(
  q: T,
  f: FiltresPatrimoine,
): T {
  if (f.type) q = q.eq('type_id', f.type)
  if (f.programme) q = q.eq('programme_id', f.programme)
  if (f.district) q = q.eq('district_id', f.district)
  if (f.epoque) q = q.eq('epoque_id', f.epoque)
  if (f.q) {
    const motif = f.q.replace(/[%,]/g, ' ')
    q = q.or(`titre_fr.ilike.%${motif}%,titre_en.ilike.%${motif}%,ville.ilike.%${motif}%`)
  }
  return q
}

export async function listePatrimoine(
  f: FiltresPatrimoine = {},
): Promise<PatrimoineListItem[]> {
  const sb = createReadClient()
  let q = sb
    .from('patrimoine')
    .select(
      'id, slug, titre_fr, titre_en, resume_fr, resume_en, type_id, programme_id, district_id, epoque_id, ville, images(chemin, est_principale, ordre)',
    )
    .eq('statut', 'publie')
    .order('titre_fr', { ascending: true })
  q = appliquerFiltres(q as never, f)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as PatrimoineListItem[]
}

export async function getPatrimoineParSlug(slug: string): Promise<PatrimoineDetail | null> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('patrimoine')
    .select(
      '*, type:types(*), programme:programmes(*), district:districts(*), epoque:epoques(*), images(*)',
    )
    .eq('slug', slug)
    .eq('statut', 'publie')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const detail = data as unknown as PatrimoineDetail
  detail.images = [...(detail.images ?? [])].sort((a, b) => a.ordre - b.ordre)
  return detail
}

// Mémoïsé par requête (React.cache) : `generateMetadata` et le composant de
// page appellent tous deux le chargement de la fiche — sans ce cache, ce
// serait deux allers-retours BDD identiques par requête.
export const getPatrimoineParSlugCache = cache(getPatrimoineParSlug)

export async function pointsPublies(f: FiltresPatrimoine = {}): Promise<PointPublie[]> {
  const sb = createReadClient()
  let q = sb
    .from('patrimoine')
    .select(
      'id, slug, titre_fr, titre_en, type_id, lat, lng, ville, images(chemin, est_principale, ordre)',
    )
    .eq('statut', 'publie')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
  q = appliquerFiltres(q as never, f)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map((row: {
    id: string; slug: string; titre_fr: string; titre_en: string | null
    type_id: string | null; lat: number; lng: number; ville: string | null; images: ImageMini[]
  }) => ({
    id: row.id,
    slug: row.slug,
    titre_fr: row.titre_fr,
    titre_en: row.titre_en,
    type_id: row.type_id,
    lat: row.lat,
    lng: row.lng,
    ville: row.ville,
    image: imagePrincipale(row.images),
  }))
}
