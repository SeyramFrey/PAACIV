import { champ } from '@/lib/i18n-champ'
import { imageUrl } from '@/lib/media'
import { slugify, slugParam, normaliserSlug } from '@/lib/slug'

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

test('slugParam: décode le paramètre de route percent-encodé', () => {
  expect(slugParam('Aka%20Raymond')).toBe('Aka Raymond')
  expect(slugParam('goly-kouassi')).toBe('goly-kouassi')
})

test('slugParam: une séquence % invalide est rendue telle quelle, sans lever', () => {
  expect(slugParam('100%')).toBe('100%')
})

test('normaliserSlug: le slug saisi à la main est normalisé comme un slug déduit', () => {
  expect(normaliserSlug('Aka Raymond', 'Adjo')).toBe('aka-raymond')
  expect(normaliserSlug('Déjà-Vu', 'x')).toBe('deja-vu')
})

test('normaliserSlug: une saisie vide ou sans reste utile retombe sur le repli', () => {
  expect(normaliserSlug(null, 'Michel Goly Kouassi')).toBe('michel-goly-kouassi')
  expect(normaliserSlug('   ', 'Adjo')).toBe('adjo')
  expect(normaliserSlug('---', 'Adjo')).toBe('adjo')
})
