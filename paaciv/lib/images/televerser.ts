import sharp from 'sharp'
import type { SupabaseClient } from '@supabase/supabase-js'
// Import relatif : scripts/variantes-images.ts réutilise ce module hors de Next.
import { LARGEURS_IMAGE, cheminVariante, cheminsStockes, type LargeurImage } from '../media'

// L'hébergement est mutualisé : un seul fil pour libvips, pour qu'un envoi de
// photos ne prenne pas tout le processeur du site.
sharp.concurrency(1)

// Les chemins sont horodatés, donc jamais réécrits : le CDN peut les garder un an.
const UN_AN = '31536000'

export type Variante = { largeur: LargeurImage; contenu: Buffer }

// Versions WebP d'une image, sans métadonnées : la position GPS d'un téléphone
// ne sort pas avec la photo. `rotate()` applique l'orientation EXIF avant de
// la retirer. Une image plus petite qu'une largeur n'est pas agrandie.
// Lève si le fichier n'est pas une image lisible.
export async function variantesImage(source: Buffer): Promise<Variante[]> {
  const variantes: Variante[] = []
  // Une à la fois : une photo de 20 Mo décodée trois fois en parallèle
  // dépasserait la mémoire allouée au site.
  for (const largeur of LARGEURS_IMAGE) {
    const contenu = await sharp(source, { failOn: 'error' })
      .rotate()
      .resize({ width: largeur, withoutEnlargement: true })
      .webp({ quality: 72 })
      .toBuffer()
    variantes.push({ largeur, contenu })
  }
  return variantes
}

// Remplace `storage.upload` pour toute image de l'admin : stocke l'original et
// ses versions réduites, que `imageUrl` sert ensuite au public.
export async function televerserImage(
  sb: SupabaseClient,
  chemin: string,
  fichier: File,
): Promise<{ error: Error | null }> {
  let variantes: Variante[]
  try {
    variantes = await variantesImage(Buffer.from(await fichier.arrayBuffer()))
  } catch (e) {
    console.error('image illisible', chemin, e)
    return { error: new Error(`Image illisible : ${fichier.name}`) }
  }

  const stockage = sb.storage.from('patrimoine')
  const { error } = await stockage.upload(chemin, fichier, {
    contentType: fichier.type || 'image/jpeg',
    cacheControl: UN_AN,
    upsert: false,
  })
  if (error) return { error }

  for (const { largeur, contenu } of variantes) {
    const { error: erreurVariante } = await stockage.upload(cheminVariante(chemin, largeur), contenu, {
      contentType: 'image/webp',
      cacheControl: UN_AN,
      upsert: false,
    })
    if (erreurVariante) {
      // Sans ses versions, l'image s'afficherait cassée : on n'en garde rien.
      await stockage.remove(cheminsStockes(chemin))
      return { error: erreurVariante }
    }
  }
  return { error: null }
}
