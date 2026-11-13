// Le carnet de visite (décision de Sey, 13/11/2026).
//
// Chaque fiche bâtiment ouverte laisse un TAMPON : le slug de la fiche et
// l'instant de la première visite. Rien d'autre n'est gardé — ni titre, ni
// image : la page « Carnet » les relit en base à chaque affichage, si bien
// qu'une fiche renommée, re-photographiée ou dépubliée se met à jour (ou
// disparaît) d'elle-même dans tous les carnets.
//
// Tout vit dans le `localStorage` du visiteur, sous une seule clé. Aucun compte,
// aucun envoi au serveur : effacer les données du site efface le carnet.
//
// Module sans dépendance React, pour être testé seul. Le branchement React
// (`useSyncExternalStore`) est dans `components/carnet/useCarnet.ts`.

export type Tampon = {
  slug: string
  // Instant de la PREMIÈRE visite, en ISO 8601 (UTC). Les visites suivantes ne
  // le déplacent pas : un tampon se pose une fois.
  premiere: string
}

export const CLE_CARNET = 'paaciv-carnet'
// Événement émis dans l'onglet courant après chaque écriture : l'événement
// `storage` du navigateur ne prévient que les AUTRES onglets.
export const EVENEMENT_CARNET = 'paaciv-carnet'

const SLUG_VALIDE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Lit un carnet sérialisé. Tout ce qui n'a pas la forme attendue est écarté
 * plutôt que de faire tomber la page : le stockage local peut contenir
 * n'importe quoi (une version future, une main qui l'a édité, un quota plein).
 */
export function analyserCarnet(brut: string | null | undefined): Tampon[] {
  if (!brut) return []
  let donnees: unknown
  try {
    donnees = JSON.parse(brut)
  } catch {
    return []
  }
  if (!Array.isArray(donnees)) return []
  const vus = new Set<string>()
  const out: Tampon[] = []
  for (const d of donnees) {
    if (!d || typeof d !== 'object') continue
    const { slug, premiere } = d as Record<string, unknown>
    if (typeof slug !== 'string' || !SLUG_VALIDE.test(slug) || vus.has(slug)) continue
    if (typeof premiere !== 'string' || Number.isNaN(Date.parse(premiere))) continue
    vus.add(slug)
    out.push({ slug, premiere })
  }
  return out
}

/** Ajoute un tampon s'il n'existe pas encore. Renvoie le carnet, inchangé sinon. */
export function ajouterTampon(carnet: Tampon[], slug: string, maintenant: Date): Tampon[] {
  if (!SLUG_VALIDE.test(slug) || carnet.some((t) => t.slug === slug)) return carnet
  return [...carnet, { slug, premiere: maintenant.toISOString() }]
}

function lireBrut(): string | null {
  try {
    return window.localStorage.getItem(CLE_CARNET)
  } catch {
    // Navigation privée stricte, stockage désactivé : le carnet est vide, et
    // le site fonctionne comme avant.
    return null
  }
}

// Instantané mémoïsé sur la chaîne brute : `useSyncExternalStore` exige que
// deux lectures sans changement renvoient le MÊME objet, sous peine de boucle
// de rendus.
let dernierBrut: string | null | undefined
let dernierCarnet: Tampon[] = []

export function lireCarnet(): Tampon[] {
  const brut = lireBrut()
  if (brut !== dernierBrut) {
    dernierBrut = brut
    dernierCarnet = analyserCarnet(brut)
  }
  return dernierCarnet
}

function ecrire(carnet: Tampon[]) {
  try {
    if (carnet.length === 0) window.localStorage.removeItem(CLE_CARNET)
    else window.localStorage.setItem(CLE_CARNET, JSON.stringify(carnet))
  } catch {
    // Quota plein ou stockage refusé : le tampon est perdu, rien d'autre.
    return
  }
  window.dispatchEvent(new Event(EVENEMENT_CARNET))
}

/** Pose le tampon d'une fiche. Sans effet si elle est déjà dans le carnet. */
export function tamponner(slug: string) {
  const avant = lireCarnet()
  const apres = ajouterTampon(avant, slug, new Date())
  if (apres !== avant) ecrire(apres)
}

export function effacerCarnet() {
  ecrire([])
}

/** Abonnement aux changements, dans cet onglet et dans les autres. */
export function abonnerCarnet(rappel: () => void): () => void {
  const surStockage = (e: StorageEvent) => {
    if (e.key === null || e.key === CLE_CARNET) rappel()
  }
  window.addEventListener(EVENEMENT_CARNET, rappel)
  window.addEventListener('storage', surStockage)
  return () => {
    window.removeEventListener(EVENEMENT_CARNET, rappel)
    window.removeEventListener('storage', surStockage)
  }
}

/**
 * La date et l'heure d'un tampon, à l'heure d'Abidjan (UTC+0 toute l'année),
 * quelle que soit l'heure du visiteur : c'est le temps du lieu qu'on raconte.
 */
export function dateAbidjan(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
    timeZone: 'Africa/Abidjan',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
