// Vocabulaire fermé de l'état de conservation d'un édifice.
//
// SOURCE DE VÉRITÉ UNIQUE. La contrainte `patrimoine_etat_conservation_valide`
// (migration 0036, qui remplace celle de 0023) accepte exactement ces cinq
// valeurs et rien d'autre ; se branchent ici le `<select>` d'admin, les deux
// barres de filtres (archives et carte), la validation de l'action
// d'enregistrement et les pastilles. Ajouter une valeur ici sans migration
// correspondante fait échouer l'écriture côté Postgres ; l'inverse laisse en
// base une valeur qu'aucun filtre ne sait afficher. Les deux moitiés bougent
// ensemble.
//
// Le vocabulaire est celui de l'association (révision de Yacouba Doukoure du
// 13/11/2026) : un DEGRÉ sur cinq niveaux, du meilleur au pire. L'ordre du
// tableau est donc signifiant : c'est l'ordre des menus et des légendes.
//
// Les valeurs stockées sont des SLUGS stables, jamais des libellés : elles
// voyagent dans les URL publiques (`/archives?etat=degrade`). C'est aussi la
// raison pour laquelle l'état n'est pas une table de référence comme `types`
// ou `districts`. Les libellés bilingues vivent dans
// `i18n/messages/{fr,en}.json`, namespace `etats`.
export const ETATS_CONSERVATION = [
  'bon_etat',
  'etat_moyen',
  'degrade',
  'fortement_degrade',
  'ruine',
] as const

export type EtatConservation = (typeof ETATS_CONSERVATION)[number]

export function estEtatConservation(v: unknown): v is EtatConservation {
  return typeof v === 'string' && (ETATS_CONSERVATION as readonly string[]).includes(v)
}

/**
 * Normalise une valeur soumise — champ de formulaire ou paramètre d'URL — vers
 * le vocabulaire, ou `null` (« non renseigné ») si elle n'en fait pas partie.
 *
 * À l'écriture, une valeur hors vocabulaire remonterait à l'éditeur/rice sous
 * forme de violation de contrainte Postgres brute. À la lecture, un
 * `?etat=nimporte-quoi` filtrerait sur une valeur qui n'existe pas et rendrait
 * une archive vide, là où l'ignorer rend l'archive complète.
 */
export function etatOuNull(v: unknown): EtatConservation | null {
  const s = (v ?? '').toString().trim()
  return estEtatConservation(s) ? s : null
}

/**
 * Les états qui font le propos militant de l'association : ce que la carte
 * « Patrimoine en danger » de « À propos » ouvre dans l'archive, par le filtre
 * de groupe `?etat=menace`. « Ruiné » n'en fait pas partie : il a sa propre
 * carte (« Patrimoine en ruine »).
 */
export const ETATS_MENACES: readonly EtatConservation[] = ['degrade', 'fortement_degrade']

export function estMenace(v: unknown): boolean {
  return estEtatConservation(v) && (ETATS_MENACES as readonly string[]).includes(v)
}

/** Le seul groupe d'états accepté par les filtres, en plus des cinq états. */
export const GROUPE_MENACE = 'menace' as const

/** Valeur d'un filtre d'état : un état précis, ou le groupe « menacé ». */
export type FiltreEtat = EtatConservation | typeof GROUPE_MENACE

/** Comme `etatOuNull`, mais accepte aussi le groupe `menace`. */
export function filtreEtatOuNull(v: unknown): FiltreEtat | null {
  const s = (v ?? '').toString().trim()
  if (s === GROUPE_MENACE) return GROUPE_MENACE
  return estEtatConservation(s) ? s : null
}

/** Les états que recouvre un filtre, pour un `in` côté base. */
export function etatsDuFiltre(f: FiltreEtat): EtatConservation[] {
  return f === GROUPE_MENACE ? [...ETATS_MENACES] : [f]
}

/**
 * Couleur de chaque état, en hexadécimal.
 *
 * POURQUOI de l'hexadécimal et non un jeton `var(--…)` : ces valeurs sont lues
 * par MapLibre, dans une expression `match` de la couche `points`, évaluée par
 * WebGL hors du document — elle ne sait pas résoudre une variable CSS.
 *
 * Ces teintes NE BASCULENT PAS avec le thème : l'état est une clé de lecture,
 * et une légende qui change de couleur entre jour et nuit se réapprend à
 * chaque bascule. Elles suivent la gradation du vocabulaire, du vert (l'édifice
 * tient) au gris éteint (il ne tient plus), et reprennent la palette existante :
 * lagune, or, latérite fraîche, rouge d'alerte, acier. L'or d'« état moyen » est
 * la seule teinte nouvelle de cette légende — PROPOSITION À VALIDER par Sey.
 */
export const COULEUR_ETAT: Record<EtatConservation, string> = {
  bon_etat: '#2F6A63',          // lagune
  etat_moyen: '#C99A3E',        // or — à valider
  degrade: '#B5652F',           // latérite fraîche
  fortement_degrade: '#B3341F', // rouge d'alerte
  ruine: '#6B6F76',             // acier éteint
}

/** Couleur d'un état, ou `null` si la valeur n'appartient pas au vocabulaire. */
export function couleurEtat(v: unknown): string | null {
  return estEtatConservation(v) ? COULEUR_ETAT[v] : null
}

/**
 * L'état le plus grave : sur la carte, son point est plus petit et plus pâle,
 * comme un édifice qui s'efface.
 */
export const ETAT_RUINE: EtatConservation = 'ruine'
