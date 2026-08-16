import { describe, it, expect } from 'vitest'
import { visuel, visuelOuNull, attributions, type Medias, type MediaSite } from '@/lib/data/medias'

function media(p: Partial<MediaSite> & { emplacement: string; chemin: string }): MediaSite {
  return { alt_fr: null, alt_en: null, credit: null, licence: null, licence_url: null, ...p }
}

function table(...m: MediaSite[]): Medias {
  return Object.fromEntries(m.map((x) => [x.emplacement, x]))
}

describe('visuel', () => {
  // Le cas réel du seed : les douze lignes portent des URL absolues Wikimedia,
  // que `imageUrl` doit laisser passer sans les préfixer du bucket.
  it('laisse passer une URL absolue telle quelle', () => {
    const t = table(media({ emplacement: 'a', chemin: 'https://exemple/photo.jpg' }))
    expect(visuel(t, 'a', 'fr', 'SECOURS').src).toBe('https://exemple/photo.jpg')
  })

  it('résout un chemin relatif contre le bucket', () => {
    const t = table(media({ emplacement: 'a', chemin: 'medias/a/1.jpg' }))
    expect(visuel(t, 'a', 'fr', 'SECOURS').src).toContain('/storage/v1/object/public/patrimoine/medias/a/1.jpg')
  })

  // La base RECOUVRE le code, elle ne le remplace pas : supprimer une ligne
  // depuis l'admin ne doit pas laisser un bloc sans fond.
  it('retombe sur le secours quand l’emplacement n’a pas de ligne', () => {
    expect(visuel(table(), 'absent', 'fr', 'SECOURS')).toEqual({ src: 'SECOURS', alt: '' })
  })

  it('prend l’alt de la langue demandée', () => {
    const t = table(media({ emplacement: 'a', chemin: 'x.jpg', alt_fr: 'Basilique', alt_en: 'Basilica' }))
    expect(visuel(t, 'a', 'fr', 'S').alt).toBe('Basilique')
    expect(visuel(t, 'a', 'en', 'S').alt).toBe('Basilica')
  })

  // Neuf des douze images sont décoratives : `alt` nul doit produire `''`,
  // c'est-à-dire une image ignorée par les lecteurs d'écran — et non la chaîne
  // « null » ni un repli sur le français.
  it('rend une image sans alt comme décorative', () => {
    const t = table(media({ emplacement: 'a', chemin: 'x.jpg' }))
    expect(visuel(t, 'a', 'fr', 'S').alt).toBe('')
  })
})

describe('visuelOuNull', () => {
  // La carte « Patrimoine démoli » : l'emplacement existe côté code, aucune
  // ligne en base, et aucun visuel de secours — elle doit rester sur son aplat.
  it('renvoie null plutôt qu’un secours quand la ligne manque', () => {
    expect(visuelOuNull(table(), 'soutien_demoli_image', 'fr')).toBeNull()
  })

  it('renvoie le visuel dès que la ligne existe', () => {
    const t = table(media({ emplacement: 'soutien_demoli_image', chemin: 'https://exemple/d.jpg' }))
    expect(visuelOuNull(t, 'soutien_demoli_image', 'fr')?.src).toBe('https://exemple/d.jpg')
  })
})

describe('attributions', () => {
  // État au jour de la migration : les douze crédits portent le marqueur. Rien
  // ne doit atteindre le public — annoncer une attribution qu'on n'a pas serait
  // pire que la ligne générique du pied de page.
  it('ignore les crédits encore marqués « À COMPLÉTER »', () => {
    const t = table(
      media({ emplacement: 'a', chemin: 'x.jpg', credit: 'À COMPLÉTER — auteur de la photographie' }),
      media({ emplacement: 'b', chemin: 'y.jpg', credit: 'À COMPLÉTER — auteur de la photographie' }),
    )
    expect(attributions(t)).toEqual([])
  })

  it('ignore une ligne sans crédit du tout', () => {
    expect(attributions(table(media({ emplacement: 'a', chemin: 'x.jpg' })))).toEqual([])
  })

  it('expose les crédits renseignés', () => {
    const t = table(
      media({ emplacement: 'a', chemin: 'x.jpg', credit: 'Awa Koné', licence: 'CC BY-SA 4.0', licence_url: 'https://exemple/cc' }),
    )
    expect(attributions(t)).toEqual([
      { credit: 'Awa Koné', licence: 'CC BY-SA 4.0', licence_url: 'https://exemple/cc' },
    ])
  })

  // Le puits de la mosquée Dieng sert deux emplacements, la Maison du Résident
  // aussi : créditer deux fois le même auteur pour la même photographie ferait
  // du bruit dans le pied de page.
  it('dédoublonne un même auteur sous la même licence', () => {
    const t = table(
      media({ emplacement: 'soutien_don_image', chemin: 'x.jpg', credit: 'Awa Koné', licence: 'CC BY-SA 4.0' }),
      media({ emplacement: 'raisons_2_image', chemin: 'x.jpg', credit: 'Awa Koné', licence: 'CC BY-SA 4.0' }),
    )
    expect(attributions(t)).toHaveLength(1)
  })

  it('garde deux entrées pour un même auteur sous deux licences', () => {
    const t = table(
      media({ emplacement: 'a', chemin: 'x.jpg', credit: 'Awa Koné', licence: 'CC BY-SA 4.0' }),
      media({ emplacement: 'b', chemin: 'y.jpg', credit: 'Awa Koné', licence: 'CC BY 2.0' }),
    )
    expect(attributions(t)).toHaveLength(2)
  })

  // Un crédit peut être renseigné avant que la licence ne le soit : on affiche
  // alors l'auteur seul plutôt que « Awa Koné (À COMPLÉTER — licence) ».
  it('tait une licence encore marquée, sans perdre le crédit', () => {
    const t = table(
      media({ emplacement: 'a', chemin: 'x.jpg', credit: 'Awa Koné', licence: 'À COMPLÉTER — licence' }),
    )
    expect(attributions(t)).toEqual([{ credit: 'Awa Koné', licence: null, licence_url: null }])
  })
})
