// Éventail des points confondus de /carte (choix de Sey du 15/11/2026).
//
// Plusieurs fiches peuvent porter EXACTEMENT les mêmes coordonnées (trois
// documents d'archives le font aujourd'hui). Pour MapLibre, ces points restent
// groupés en un amas jusqu'au dernier zoom de regroupement, puis s'empilent au
// même pixel : seul celui du dessus se survole ou se clique, les autres sont
// inaccessibles. Au clic, l'amas (ou la pile) s'ouvre en éventail : chaque
// point s'écarte en cercle autour de sa position, relié à elle par un trait,
// et se survole et se clique comme un point ordinaire.
//
// Ce module ne contient que la géométrie, en pixels d'écran, pour être testé
// sans carte (lib/__tests__/carte-eventail.test.ts).

/** Distance minimale entre deux centres : un point mesure 20 px (rayon 8 + liseré 2), plus de l'air. */
export const ECART_EVENTAIL = 28

/** Rayon minimal du cercle : l'amas reste visible au centre, les traits partent de lui. */
export const RAYON_MIN_EVENTAIL = 38

/** Durée du déploiement. Aucune animation sous `prefers-reduced-motion`. */
export const DUREE_EVENTAIL_MS = 260

/**
 * Décalages en pixels (x vers la droite, y vers le bas) de `n` points disposés
 * en cercle autour de leur position commune, le premier à midi. Le rayon
 * grandit avec le nombre de points pour que deux voisins restent à
 * `ECART_EVENTAIL` l'un de l'autre au moins.
 */
export function positionsEventail(n: number): [number, number][] {
  if (n <= 0) return []
  // Corde entre deux voisins d'un cercle de rayon r : 2·r·sin(π/n).
  const rayon = n === 1 ? RAYON_MIN_EVENTAIL : Math.max(RAYON_MIN_EVENTAIL, ECART_EVENTAIL / (2 * Math.sin(Math.PI / n)))
  return Array.from({ length: n }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n
    return [rayon * Math.cos(angle), rayon * Math.sin(angle)]
  })
}

/**
 * Vrai si zoomer ne séparerait plus les points de l'amas. MapLibre rend, pour
 * un amas de points confondus, un zoom d'expansion AU-DELÀ du dernier zoom de
 * regroupement : à ce zoom-là, les points ne sont plus groupés mais restent
 * empilés au même pixel.
 */
export function doitOuvrirEventail(zoomExpansion: number, dernierZoomAmas: number) {
  return zoomExpansion > dernierZoomAmas
}

/** Courbe du déploiement (sortie franche, arrivée ralentie), bornée à [0, 1]. */
export function progressionEventail(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return 1 - (1 - x) ** 3
}
