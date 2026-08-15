import { cache } from 'react'
import { createReadClient } from '@/lib/supabase/reader'
import { imagePrincipale, imageUrl, type ImageMini } from '@/lib/media'

export type PointCle = {
  id: string
  titre_fr: string
  titre_en: string | null
  texte_fr: string | null
  texte_en: string | null
}

export type Activite = {
  id: string
  titre_fr: string
  titre_en: string | null
  cadence_fr: string | null
  cadence_en: string | null
  description_fr: string | null
  description_en: string | null
  cta_libelle_fr: string | null
  cta_libelle_en: string | null
  cta_href: string | null
  image: string | null
}

export type Temoignage = {
  id: string
  nom: string
  role_fr: string | null
  role_en: string | null
  citation_fr: string
  citation_en: string | null
  note: number
}

export type VedetteHero = {
  slug: string
  titre_fr: string
  titre_en: string | null
  ville: string | null
  date_texte: string | null
  image: string
}

export type VignetteArchive = {
  slug: string
  titre_fr: string
  titre_en: string | null
  ville: string | null
  type_id: string | null
  image: string
}

export type Chiffres = {
  fiches: number
  villes: number
  architectes: number
  articles: number
}

export async function listePointsCles(bloc: 'pourquoi' | 'raisons'): Promise<PointCle[]> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('points_cles')
    .select('id, titre_fr, titre_en, texte_fr, texte_en')
    .eq('bloc', bloc)
    .eq('statut', 'publie')
    .order('ordre', { ascending: true })
  if (error) throw error
  return (data ?? []) as PointCle[]
}

export async function listeActivites(): Promise<Activite[]> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('activites')
    .select(
      'id, titre_fr, titre_en, cadence_fr, cadence_en, description_fr, description_en, cta_libelle_fr, cta_libelle_en, cta_href, image',
    )
    .eq('statut', 'publie')
    .order('ordre', { ascending: true })
  if (error) throw error
  return ((data ?? []) as Activite[]).map((a) => ({
    ...a,
    image: a.image ? imageUrl(a.image) : null,
  }))
}

export async function listeTemoignages(): Promise<Temoignage[]> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('temoignages')
    .select('id, nom, role_fr, role_en, citation_fr, citation_en, note')
    .eq('statut', 'publie')
    .order('ordre', { ascending: true })
  if (error) throw error
  return (data ?? []) as Temoignage[]
}

type LigneAvecImages = {
  slug: string
  titre_fr: string
  titre_en: string | null
  ville: string | null
  date_texte?: string | null
  type_id?: string | null
  images: ImageMini[]
}

export async function vedettesHero(limite = 5): Promise<VedetteHero[]> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('patrimoine')
    .select('slug, titre_fr, titre_en, ville, date_texte, images(chemin, est_principale, ordre)')
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })
  if (error) throw error

  // On charge tout puis on tranche en mémoire, plutôt que d'ajouter
  // `images!inner(...)` et un `.limit(limite)` sur la requête : c'est du
  // sur-fetch assumé (pas un optimum), mais ça garde un seul type
  // `LigneAvecImages` partagé avec `vignettesArchive` au lieu de dupliquer un
  // hint de jointure sur deux requêtes — et le volume actuel (une poignée de
  // fiches publiées) rend ce sur-fetch sans conséquence.
  //
  // Piège pour un futur changement : ajouter `.limit(limite)` à la requête
  // SANS passer aussi à `images!inner(...)` serait un bug. La troncature SQL
  // s'appliquerait avant le filtre `.image !== null` ci-dessous, et la
  // fonction pourrait renvoyer moins de `limite` éléments alors que d'autres
  // fiches éligibles existent plus loin dans la table. Les deux changements
  // vont ensemble, ou pas du tout.
  return ((data ?? []) as unknown as LigneAvecImages[])
    .map((r) => ({
      slug: r.slug,
      titre_fr: r.titre_fr,
      titre_en: r.titre_en,
      ville: r.ville,
      date_texte: r.date_texte ?? null,
      image: imagePrincipale(r.images),
    }))
    .filter((r): r is VedetteHero => r.image !== null)
    .slice(0, limite)
}

export async function vignettesArchive(limite = 12): Promise<VignetteArchive[]> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('patrimoine')
    .select('slug, titre_fr, titre_en, ville, type_id, images(chemin, est_principale, ordre)')
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })
  if (error) throw error

  // Sur-fetch assumé, même raison que `vedettesHero` ci-dessus : ne pas
  // ajouter `.limit(limite)` sans passer aussi `images!inner(...)`.
  return ((data ?? []) as unknown as LigneAvecImages[])
    .map((r) => ({
      slug: r.slug,
      titre_fr: r.titre_fr,
      titre_en: r.titre_en,
      ville: r.ville,
      type_id: r.type_id ?? null,
      image: imagePrincipale(r.images),
    }))
    .filter((r): r is VignetteArchive => r.image !== null)
    .slice(0, limite)
}

export async function villesArchive(): Promise<string[]> {
  const sb = createReadClient()
  const { data, error } = await sb.from('patrimoine').select('ville').eq('statut', 'publie')
  if (error) throw error
  const villes = (data ?? [])
    .map((r) => (r.ville ?? '').trim())
    .filter((v) => v.length > 0)
  return Array.from(new Set(villes)).sort((a, b) => a.localeCompare(b, 'fr'))
}

// Compteurs du bloc « L'association ». Mémoïsé : le bloc les affiche et le
// bloc carte réutilise le nombre de fiches.
export const chiffresCles = cache(async function chiffresCles(): Promise<Chiffres> {
  const sb = createReadClient()
  const compte = async (table: string) => {
    const { count, error } = await sb
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'publie')
    if (error) throw error
    return count ?? 0
  }
  const [fiches, architectes, articles, villes] = await Promise.all([
    compte('patrimoine'),
    compte('architectes'),
    compte('articles'),
    villesArchive().then((v) => v.length),
  ])
  return { fiches, villes, architectes, articles }
})
