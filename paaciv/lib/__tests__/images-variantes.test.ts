// @vitest-environment node
import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { cheminsStockes, imageUrl, srcsetImage } from '@/lib/media'
import { variantesImage } from '@/lib/images/televerser'

describe('srcsetImage', () => {
  it('liste les trois versions d’une image du bucket', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
    const base = 'https://x.supabase.co/storage/v1/object/public/patrimoine/a/1.jpg'
    expect(srcsetImage(imageUrl('a/1.jpg'))).toBe(
      `${base}.480.webp 480w, ${base}.960.webp 960w, ${base}.1600.webp 1600w`,
    )
  })

  it('ne touche ni à une URL externe ni à un fichier du site', () => {
    expect(srcsetImage('https://upload.wikimedia.org/x.jpg')).toBeUndefined()
    expect(srcsetImage('/separateur.png')).toBeUndefined()
    expect(srcsetImage(null)).toBeUndefined()
  })
})

it('cheminsStockes : l’original et ses trois versions, pour tout supprimer', () => {
  expect(cheminsStockes('a/1.jpg')).toEqual(['a/1.jpg', 'a/1.jpg.480.webp', 'a/1.jpg.960.webp', 'a/1.jpg.1600.webp'])
})

describe('variantesImage', () => {
  it('réduit une grande photo en WebP, sans dépasser chaque largeur', async () => {
    const photo = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#c86' } })
      .jpeg()
      .toBuffer()
    const variantes = await variantesImage(photo)
    const tailles = await Promise.all(variantes.map(async (v) => ({ l: v.largeur, ...(await sharp(v.contenu).metadata()) })))
    expect(tailles.map((t) => [t.l, t.format, t.width, t.height])).toEqual([
      [480, 'webp', 480, 360],
      [960, 'webp', 960, 720],
      [1600, 'webp', 1600, 1200],
    ])
  })

  it('n’agrandit pas une petite image', async () => {
    const petite = await sharp({ create: { width: 300, height: 200, channels: 3, background: '#000' } }).png().toBuffer()
    const variantes = await variantesImage(petite)
    for (const v of variantes) expect((await sharp(v.contenu).metadata()).width).toBe(300)
  })

  it('applique l’orientation du téléphone, puis retire les métadonnées', async () => {
    // Photo prise en portrait : pixels en paysage, EXIF orientation 6.
    const photo = await sharp({ create: { width: 2000, height: 1000, channels: 3, background: '#fff' } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer()
    const [v] = await variantesImage(photo)
    const meta = await sharp(v.contenu).metadata()
    expect([meta.width, meta.height]).toEqual([480, 960])
    expect(meta.exif).toBeUndefined()
    expect(meta.orientation).toBeUndefined()
  })

  it('refuse un fichier qui n’est pas une image', async () => {
    await expect(variantesImage(Buffer.from('pas une image'))).rejects.toThrow()
  })
})
