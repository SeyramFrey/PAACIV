import { describe, expect, it } from 'vitest'
import { extraireIdYoutube, lecteurYoutube, miniatureYoutube } from '@/lib/youtube'

describe('extraireIdYoutube', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?list=PL1&v=dQw4w9WgXcQ&t=42', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?t=42', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('extrait l\'identifiant de %s', (url, attendu) => {
    expect(extraireIdYoutube(url)).toBe(attendu)
  })

  it.each([
    [null], [undefined], [''], ['   '],
    ['https://example.com/watch?v=dQw4w9WgXcQ'],   // bon motif, mauvais domaine
    ['https://www.youtube.com/watch?v=trop-court'], // identifiant non conforme
    ['pas une url du tout'],
  ])('rejette %s', (url) => {
    expect(extraireIdYoutube(url as string | null | undefined)).toBeNull()
  })
})

it('construit les URL de miniature et de lecteur sans cookie', () => {
  expect(miniatureYoutube('dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
  expect(lecteurYoutube('dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
})
