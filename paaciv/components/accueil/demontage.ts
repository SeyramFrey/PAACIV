// Calendrier du démontage de l'éléphant au défilement.
//
// Module à part, sans three.js : la section (chargée avec la page) et la scène
// 3D (chargée à la demande) lisent le même calendrier, sans que la section
// tire three.js dans le bundle de l'accueil.

// Fenêtre du défilement où les éclats se détachent, l'un après l'autre. Avant
// `DEBUT`, on lit le titre sur l'éléphant entier ; après `FIN`, la vue éclatée
// reste posée le temps de choisir.
export const DEBUT = 0.12
export const FIN = 0.82

// Part du démontage d'un éclat, de 0 à 1, selon l'avancement général `p`
// (0 = haut de la section, 1 = bas) et son rang dans l'ordre de démontage.
// Un éclat absent de l'ordre (rang -1) ne bouge pas.
export function partEclat(p: number, rang: number, total: number): number {
  if (rang < 0 || total <= 0) return 0
  const pas = (FIN - DEBUT) / total
  const t = Math.min(1, Math.max(0, (p - DEBUT - rang * pas) / pas))
  // Accélère puis freine : l'éclat se décolle, puis se pose.
  return t * t * (3 - 2 * t)
}
