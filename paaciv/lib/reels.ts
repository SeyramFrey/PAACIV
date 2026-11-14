// Les réels Instagram de l'accueil : fonctions pures, testées sans réseau.
//
// La roue (components/accueil/RoueReels.tsx) dispose les cartes sur un grand
// cercle dont le centre est sous la scène, comme la référence de Sey du
// 15/11/2026. `position` est un nombre réel : la carte d'indice `position`
// est au sommet, les autres s'en écartent d'un pas d'angle par rang. La roue
// boucle : au-delà de la moitié du paquet, une carte revient de l'autre côté.

/** Le compte de l'association, crédité quand un réel n'a pas d'autre auteur. */
export const COMPTE_INSTAGRAM = 'paaciv'
export const URL_COMPTE_INSTAGRAM = `https://www.instagram.com/${COMPTE_INSTAGRAM}/`

/** Écart signé d'une carte au sommet, ramené dans [-n/2, n/2). */
export function ecartCarte(index: number, position: number, n: number): number {
  if (n <= 0) return 0
  let d = (index - position) % n
  if (d < -n / 2) d += n
  if (d >= n / 2) d -= n
  return d
}

/** Indice de la carte au sommet, pour une position quelconque. */
export function carteAuSommet(position: number, n: number): number {
  if (n <= 0) return 0
  return ((Math.round(position) % n) + n) % n
}

/**
 * Au-delà de ce rang, une carte est hors de la scène : elle n'est ni dessinée
 * ni atteignable. Trois de chaque côté, comme la référence.
 */
export const RANG_VISIBLE = 3.5

/** Un lien de post Instagram accepté par la base (contrainte de 0037_reels). */
export function estLienInstagram(url: string | null | undefined): boolean {
  if (!url) return false
  return /^https:\/\/(www\.)?instagram\.com\/\S+$/.test(url.trim())
}
