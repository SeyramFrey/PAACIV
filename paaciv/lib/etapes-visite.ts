// Les étapes de la visite de l'accueil (décision de Sey du 14/11/2026, voir
// docs/design-ref/exploration-immersive.md § 10).
//
// L'ordre du tableau EST l'ordre de la page : il numérote les surtitres
// (« 03 · Carte ») et le rail. Chaque valeur sert aussi d'ancre (`#carte`) et
// de clé de traduction (`visite.etapes.<etape>`).
//
// Ce qui suit le carnet (agenda, journal, activités, adhésion) n'est pas une
// étape : c'est l'épilogue, « La vie de l'association ». Le rail s'y efface.
export const ETAPES_VISITE = ['entree', 'sommaire', 'carte', 'lieux', 'archives', 'carnet'] as const

export type EtapeVisite = (typeof ETAPES_VISITE)[number]

/** La zone de la page après le carnet. */
export const EPILOGUE = 'epilogue' as const

export type ZoneVisite = EtapeVisite | typeof EPILOGUE

export function estEtapeVisite(v: unknown): v is EtapeVisite {
  return typeof v === 'string' && (ETAPES_VISITE as readonly string[]).includes(v)
}

/** Rang de l'étape, à partir de 1. */
export function rangEtape(etape: EtapeVisite): number {
  return ETAPES_VISITE.indexOf(etape) + 1
}

/** Numéro affiché, sur deux chiffres : « 03 ». */
export function numeroEtape(etape: EtapeVisite): string {
  return String(rangEtape(etape)).padStart(2, '0')
}

/**
 * Le rail ne s'affiche que pendant la visite proprement dite : ni sur l'entrée
 * (le film du haut de page occupe l'écran), ni dans l'épilogue.
 */
export function railVisible(zone: ZoneVisite | null): boolean {
  return zone !== null && zone !== 'entree' && zone !== EPILOGUE
}
