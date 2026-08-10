const BUCKET = 'patrimoine'

export function imageUrl(chemin: string): string {
  if (/^https?:\/\//i.test(chemin)) return chemin
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${base}/storage/v1/object/public/${BUCKET}/${chemin}`
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
