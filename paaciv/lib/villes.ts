import { slugify } from '@/lib/slug'

// Regroupement des fiches par commune.
//
// Pur, donc testable sans base de données : c'est ici que se décide ce qui
// compte pour « la même ville », et ce jugement mérite d'être vérifié plutôt
// que constaté à l'écran.
//
// POURQUOI PAS UNE TABLE `villes` : `patrimoine.ville` est un champ LIBRE
// depuis la phase 2, déjà rempli, et déjà utilisé tel quel par le bandeau de
// l'accueil, la carte du territoire et la recherche de l'archive. Introduire
// une table de référence obligerait à migrer ces valeurs, à ajouter un écran
// d'administration, et à choisir quoi faire des fiches dont la commune ne
// figure pas encore dans la table. Les communes sont donc DÉRIVÉES du corpus :
// une commune existe parce qu'un édifice s'y trouve, ce qui est exactement le
// sens qu'on veut lui donner sur ce site. Le texte de présentation, lui, vit
// dans `contenu_site` sous la clé `ville_<slug>_intro` (migration 0030) — la
// seule chose qu'on ne peut pas dériver.

export type Groupe<T> = {
  /** Identifiant d'URL, dérivé du nom : `/villes/grand-bassam`. */
  slug: string
  /** Nom tel qu'il est écrit en base, pour l'affichage. */
  nom: string
  items: T[]
}

/**
 * Regroupe des fiches par commune.
 *
 * Le regroupement se fait sur le SLUG et non sur la chaîne brute : « Grand
 * Bassam », « grand-bassam » et « Grand-Bassam » désignent la même ville et
 * doivent atterrir sur la même page. Sans cette normalisation, une variante de
 * saisie créerait une commune fantôme à un seul édifice — et deux entrées
 * concurrentes dans le compteur « Communes » de l'accueil.
 *
 * Le nom affiché est celui de la PREMIÈRE fiche rencontrée dans l'ordre reçu.
 * L'appelant lit la table triée par titre, ce qui rend le choix stable d'un
 * chargement à l'autre — arbitraire, mais reproductible, ce qui est ce qui
 * compte pour une URL.
 *
 * Les fiches sans commune sont écartées : elles ne peuvent pas alimenter une
 * page de commune, et une entrée « (sans nom) » ne mènerait nulle part.
 */
export function grouperParVille<T extends { ville: string | null }>(lignes: T[]): Groupe<T>[] {
  const par = new Map<string, Groupe<T>>()
  for (const ligne of lignes) {
    const nom = (ligne.ville ?? '').trim()
    if (nom.length === 0) continue
    const slug = slugify(nom)
    // `slugify` rend '' d'une chaîne sans aucun caractère alphanumérique
    // (« — », « ??? ») : une telle valeur donnerait l'URL `/villes/`, qui est
    // l'index. On l'écarte comme une commune absente.
    if (slug.length === 0) continue
    const existant = par.get(slug)
    if (existant) existant.items.push(ligne)
    else par.set(slug, { slug, nom, items: [ligne] })
  }
  return [...par.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

/** Le groupe correspondant à un slug d'URL, ou `undefined`. */
export function trouverVille<T extends { ville: string | null }>(
  lignes: T[],
  slug: string,
): Groupe<T> | undefined {
  // On regroupe puis on cherche, plutôt que de filtrer directement sur le slug :
  // les deux chemins appliquent ainsi exactement les mêmes règles de
  // normalisation. Un filtre écrit à part finirait par diverger — et la page
  // d'une commune afficherait alors un compte différent de celui de l'index.
  return grouperParVille(lignes).find((g) => g.slug === slug)
}

/** Clé du texte de présentation d'une commune dans `contenu_site`. */
export function cleTexteVille(slug: string): string {
  return `ville_${slug}_intro`
}
