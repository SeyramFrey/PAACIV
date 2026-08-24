import { cache } from 'react'
import { listePatrimoine, type PatrimoineListItem } from '@/lib/data/patrimoine'
import { grouperParVille, trouverVille, type Groupe } from '@/lib/villes'

// Accès aux communes. Toute la logique de regroupement est dans `lib/villes.ts`,
// pure et testée ; ce fichier ne fait que la brancher sur la base.

export type Ville = Groupe<PatrimoineListItem>

/**
 * Le corpus publié, mémoïsé par requête.
 *
 * Une page de commune appelle `generateMetadata` PUIS le composant de page, et
 * l'index affiche toutes les communes d'un coup : sans ce cache, la même
 * lecture de `patrimoine` partirait deux à trois fois par affichage. Même
 * raison que `getPatrimoineParSlugCache`.
 *
 * On charge la liste ENTIÈRE et on regroupe en mémoire, plutôt que d'écrire un
 * `.eq('ville', nom)` par page. Deux raisons : la commune de l'URL est un SLUG,
 * que Postgres ne sait pas rapprocher des variantes de saisie (« Grand
 * Bassam » / « Grand-Bassam ») sans dupliquer côté SQL la normalisation de
 * `lib/villes.ts` ; et le corpus tient de toute façon dans une page.
 */
const corpus = cache(async function corpus(): Promise<PatrimoineListItem[]> {
  return listePatrimoine()
})

export const listeVilles = cache(async function listeVilles(): Promise<Ville[]> {
  return grouperParVille(await corpus())
})

export async function villeParSlug(slug: string): Promise<Ville | undefined> {
  return trouverVille(await corpus(), slug)
}

/**
 * Centre et points d'une commune, pour l'extrait de carte.
 *
 * Le centre est la moyenne des points SITUÉS. Une commune dont aucune fiche
 * n'a de coordonnées rend `null` — l'appelant n'affiche alors pas de carte,
 * plutôt qu'une carte centrée sur l'origine du repère, au large du golfe de
 * Guinée.
 */
export function centreVille(v: Ville): { lat: number; lng: number } | null {
  const situes = v.items.filter(
    (i): i is PatrimoineListItem & { lat: number; lng: number } => i.lat != null && i.lng != null,
  )
  if (situes.length === 0) return null
  return {
    lat: situes.reduce((s, i) => s + i.lat, 0) / situes.length,
    lng: situes.reduce((s, i) => s + i.lng, 0) / situes.length,
  }
}
