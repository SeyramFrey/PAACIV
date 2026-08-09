import { champ } from '@/lib/i18n-champ'
import { imageUrl } from '@/lib/media'
import { slugify } from '@/lib/slug'

test('champ: repli sur le français si anglais manquant', () => {
  expect(champ('Cathédrale', 'Cathedral', 'en')).toBe('Cathedral')
  expect(champ('Cathédrale', null, 'en')).toBe('Cathédrale')
  expect(champ('Cathédrale', 'Cathedral', 'fr')).toBe('Cathédrale')
})

test('imageUrl: URL externe telle quelle, sinon URL publique du bucket', () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  expect(imageUrl('https://exemple.com/p.jpg')).toBe('https://exemple.com/p.jpg')
  expect(imageUrl('dossier/p.jpg')).toBe(
    'https://x.supabase.co/storage/v1/object/public/patrimoine/dossier/p.jpg',
  )
})

test('slugify: ASCII minuscule tireté', () => {
  expect(slugify('Cathédrale Saint-Paul (Abidjan)')).toBe('cathedrale-saint-paul-abidjan')
})
