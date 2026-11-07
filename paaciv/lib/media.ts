const BUCKET = 'patrimoine'

// Chaque image envoyée depuis l'admin est stockée telle quelle, accompagnée de
// versions WebP réduites (voir lib/images/televerser.ts). Le site ne sert
// jamais l'original : une photo de téléphone pèse 3 à 20 Mo, une page entière
// doit tenir sous 1 Mo sur un réseau mobile.
export const LARGEURS_IMAGE = [480, 960, 1600] as const
export type LargeurImage = (typeof LARGEURS_IMAGE)[number]

const estExterne = (chemin: string) => /^https?:\/\//i.test(chemin)

export function cheminVariante(chemin: string, largeur: LargeurImage): string {
  return `${chemin}.${largeur}.webp`
}

// Tous les fichiers stockés pour une image : l'original et ses versions.
export function cheminsStockes(chemin: string): string[] {
  return [chemin, ...LARGEURS_IMAGE.map((l) => cheminVariante(chemin, l))]
}

function urlPublique(chemin: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${base}/storage/v1/object/public/${BUCKET}/${chemin}`
}

// URL d'une image : une URL externe telle quelle, sinon sa version réduite.
export function imageUrl(chemin: string, largeur: LargeurImage = 1600): string {
  if (estExterne(chemin)) return chemin
  return urlPublique(cheminVariante(chemin, largeur))
}

const VARIANTE = new RegExp(`^(.*/storage/v1/object/public/${BUCKET}/.+)\\.(?:${LARGEURS_IMAGE.join('|')})\\.webp$`)

// `srcset` d'une URL rendue par `imageUrl`, pour que le navigateur prenne la
// plus petite version suffisante. Rien pour une URL externe ou un fichier du
// site : `<img srcSet={undefined}>` n'écrit pas l'attribut.
export function srcsetImage(url: string | null | undefined): string | undefined {
  const m = url?.match(VARIANTE)
  if (!m) return undefined
  return LARGEURS_IMAGE.map((l) => `${m[1]}.${l}.webp ${l}w`).join(', ')
}

export type ImageMini = { chemin: string; est_principale: boolean; ordre: number }

// Choisit l'image de couverture d'une fiche : l'image marquée principale,
// sinon celle de plus petit `ordre`. Partagé par lib/data/patrimoine.ts et
// lib/data/architectes.ts pour que la règle ne diverge pas silencieusement.
export function imagePrincipale(images: ImageMini[] | null): string | null {
  if (!images || images.length === 0) return null
  const principale =
    images.find((i) => i.est_principale) ??
    [...images].sort((a, b) => a.ordre - b.ordre)[0]
  return principale ? imageUrl(principale.chemin) : null
}
