// Où une photo s'affiche sur la fiche bâtiment (migration 0036) : la galerie
// du haut, ou l'un des deux onglets demandés par l'association. Pendant de la
// contrainte `images_groupe_valide` : les deux moitiés bougent ensemble.
// Fichier à part, sans dépendance serveur, pour servir aussi les formulaires
// d'admin rendus dans le navigateur.
export const GROUPES_IMAGE = ['galerie', 'etat_actuel', 'documentation'] as const

export type GroupeImage = (typeof GROUPES_IMAGE)[number]

export function estGroupeImage(v: unknown): v is GroupeImage {
  return typeof v === 'string' && (GROUPES_IMAGE as readonly string[]).includes(v)
}
