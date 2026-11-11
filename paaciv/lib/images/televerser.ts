import sharp from 'sharp'
import decoderHeic from 'heic-decode'
import type { SupabaseClient } from '@supabase/supabase-js'
// Import relatif : scripts/variantes-images.ts réutilise ce module hors de Next.
import { LARGEURS_IMAGE, cheminVariante, cheminsStockes, type LargeurImage } from '../media'

// L'hébergement est mutualisé : un seul fil pour libvips, pour qu'un envoi de
// photos ne prenne pas tout le processeur du site.
sharp.concurrency(1)

// Les chemins sont horodatés, donc jamais réécrits : le CDN peut les garder un an.
const UN_AN = '31536000'

export type Variante = { largeur: LargeurImage; contenu: Buffer }

// Marques HEIF qui contiennent du HEVC. L'AVIF (marque `avif`), que sharp lit
// très bien, n'en fait pas partie.
const MARQUES_HEIC = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis'])

function estHeic(source: Buffer): boolean {
  if (source.length < 16 || source.toString('latin1', 4, 8) !== 'ftyp') return false
  const taille = Math.min(source.readUInt32BE(0), source.length)
  const majeure = source.toString('latin1', 8, 12)
  if (MARQUES_HEIC.has(majeure)) return true
  // `mif1` est générique : HEIC seulement si une marque compatible le dit.
  if (majeure !== 'mif1' && majeure !== 'msf1') return false
  for (let i = 16; i + 4 <= taille; i += 4) {
    if (MARQUES_HEIC.has(source.toString('latin1', i, i + 4))) return true
  }
  return false
}

// Les iPhone, et beaucoup d'Android (Samsung en « photos haute efficacité »),
// enregistrent leurs photos en HEIC. Le sharp précompilé ne lit pas le HEVC,
// pour des raisons de brevets : avant ce correctif, une photo envoyée depuis
// un téléphone faisait planter l'admin (11 novembre 2026). Le HEIC est donc
// décodé à part, en WebAssembly, puis réécrit en JPEG : l'original stocké est
// alors lisible par tous les navigateurs, ce que le HEIC n'est pas.
// Toute autre image passe telle quelle.
export async function normaliserImage(source: Buffer, type: string): Promise<{ contenu: Buffer; type: string }> {
  if (!estHeic(source)) return { contenu: source, type: type || 'image/jpeg' }
  // libheif applique déjà la rotation enregistrée dans le fichier : les
  // pixels décodés sont à l'endroit.
  const { width, height, data } = await decoderHeic({ buffer: source })
  const contenu = await sharp(Buffer.from(data.buffer, data.byteOffset, data.byteLength), {
    raw: { width, height, channels: 4 },
  })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer()
  return { contenu, type: 'image/jpeg' }
}

// Versions WebP d'une image, sans métadonnées : la position GPS d'un téléphone
// ne sort pas avec la photo. `rotate()` applique l'orientation EXIF avant de
// la retirer. Une image plus petite qu'une largeur n'est pas agrandie.
// Lève si le fichier n'est pas une image lisible.
export async function variantesImage(brut: Buffer): Promise<Variante[]> {
  const { contenu: source } = await normaliserImage(brut, '')
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
): Promise<{ error: Error | null; illisible?: true }> {
  let variantes: Variante[]
  let original: { contenu: Buffer; type: string }
  try {
    original = await normaliserImage(Buffer.from(await fichier.arrayBuffer()), fichier.type)
    variantes = await variantesImage(original.contenu)
  } catch (e) {
    // `illisible` distingue le fichier refusé (à dire à l'utilisateur) d'une
    // panne du stockage (à laisser remonter).
    console.error('image illisible', chemin, e)
    return { error: new Error(`Image illisible : ${fichier.name}`), illisible: true }
  }

  // Un HEIC est stocké en JPEG, sous le chemin choisi par l'appelant (qui peut
  // finir en `.heic`) : c'est le type de contenu, pas l'extension, qui dit au
  // navigateur comment l'afficher.
  const stockage = sb.storage.from('patrimoine')
  const { error } = await stockage.upload(chemin, original.contenu, {
    contentType: original.type,
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
