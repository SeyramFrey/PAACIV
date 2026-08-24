// Vocabulaire fermé de l'état de conservation d'un édifice.
//
// SOURCE DE VÉRITÉ UNIQUE. La contrainte `patrimoine_etat_conservation_valide`
// (migration 0023) accepte exactement ces quatre valeurs et rien d'autre ;
// quatre consommateurs se branchent ici — le `<select>` d'admin, les deux
// barres de filtres (archives et carte), et la validation de l'action
// d'enregistrement. Ajouter une valeur ici sans migration correspondante fait
// échouer l'écriture côté Postgres ; l'inverse laisse en base une valeur
// qu'aucun filtre ne sait afficher. Les deux moitiés bougent ensemble.
//
// Les valeurs stockées sont des SLUGS stables, jamais des libellés : elles
// voyagent dans les URL publiques (`/archives?etat=en_danger`, destination des
// cartes de la page d'accueil). C'est aussi la raison pour laquelle l'état
// n'est pas une table de référence comme `types` ou `districts` — un UUID dans
// une URL serait illisible et se casserait à la moindre recréation de ligne.
// Les libellés bilingues vivent dans `i18n/messages/{fr,en}.json`, namespace
// `etats`.
export const ETATS_CONSERVATION = ['intact', 'en_restauration', 'en_danger', 'demoli'] as const

export type EtatConservation = (typeof ETATS_CONSERVATION)[number]

export function estEtatConservation(v: unknown): v is EtatConservation {
  return typeof v === 'string' && (ETATS_CONSERVATION as readonly string[]).includes(v)
}

/**
 * Normalise une valeur soumise — champ de formulaire ou paramètre d'URL — vers
 * le vocabulaire, ou `null` (« non renseigné ») si elle n'en fait pas partie.
 *
 * Deux raisons de ne pas laisser passer la valeur brute. À l'écriture : une
 * valeur hors vocabulaire remonterait à l'éditeur/rice sous forme de violation
 * de contrainte Postgres brute, illisible — même raisonnement que
 * `validerCoordonnee` devant `patrimoine_lat_bornes`. À la lecture : un
 * `?etat=nimporte-quoi` dans une URL publique filtrerait sur une valeur qui
 * n'existe pas et rendrait une archive vide, là où l'ignorer rend l'archive
 * complète.
 */
export function etatOuNull(v: unknown): EtatConservation | null {
  const s = (v ?? '').toString().trim()
  return estEtatConservation(s) ? s : null
}

/**
 * Couleur de chaque état, en hexadécimal.
 *
 * POURQUOI de l'hexadécimal et non un jeton `var(--…)` comme partout ailleurs :
 * ces valeurs sont lues par MapLibre, dans une expression `match` de la couche
 * `points`. Une expression de style de carte est évaluée par WebGL, hors du
 * document — elle ne sait pas résoudre une variable CSS. Une même constante
 * sert donc la carte et l'interface, plutôt qu'une palette de carte qui
 * dériverait en silence de celle des pastilles.
 *
 * Conséquence assumée : ces quatre teintes NE BASCULENT PAS avec le thème.
 * C'est ici une qualité et non un pis-aller — l'état de conservation est une
 * clé de lecture, et un rouge qui changerait de valeur entre le mode clair et
 * le mode sombre demanderait de réapprendre la légende à chaque bascule. Elles
 * sont choisies en tons moyens pour tenir sur les deux fonds, et reprennent les
 * matières de la palette (lagune, latérite, rouge d'alerte, acier).
 */
export const COULEUR_ETAT: Record<EtatConservation, string> = {
  intact: '#2F6A63',          // lagune — l'édifice tient
  en_restauration: '#B5652F', // latérite fraîche — le chantier est ouvert
  en_danger: '#B3341F',       // rouge d'alerte
  demoli: '#6B6F76',          // acier éteint — il n'y a plus de bâtiment
}

/** Couleur d'un état, ou `null` si la valeur n'appartient pas au vocabulaire. */
export function couleurEtat(v: unknown): string | null {
  return estEtatConservation(v) ? COULEUR_ETAT[v] : null
}

/**
 * Les deux états qui font le propos militant de l'association : ce que la carte
 * des menaces met en avant, et ce que les cartes de soutien de l'accueil
 * pointent déjà (`/archives?etat=en_danger`).
 */
export const ETATS_MENACES: readonly EtatConservation[] = ['en_danger', 'demoli']

export function estMenace(v: unknown): boolean {
  return estEtatConservation(v) && (ETATS_MENACES as readonly string[]).includes(v)
}
