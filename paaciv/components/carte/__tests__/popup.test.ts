import { describe, it, expect } from 'vitest'
import { construirePopupContenu } from '@/components/carte/popup'

describe('construirePopupContenu', () => {
  it('affiche titre, badge de type et ville', () => {
    const el = construirePopupContenu({
      titre: 'Cathédrale Saint-Paul',
      ville: 'Abidjan',
      image: null,
      typeNom: 'Religieux',
      typeCouleur: '#8A3E1B',
    })
    expect(el.querySelector('strong')?.textContent).toBe('Cathédrale Saint-Paul')
    expect(el.textContent).toContain('Religieux')
    expect(el.textContent).toContain('Abidjan')
    expect(el.querySelector('img')).toBeNull()
  })

  it('ajoute une vignette quand image est fournie', () => {
    const el = construirePopupContenu({
      titre: 'Gare de Bouaké',
      ville: null,
      image: 'https://example.test/img.jpg',
      typeNom: null,
      typeCouleur: null,
    })
    const img = el.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe('https://example.test/img.jpg')
    expect(el.textContent).toContain('Gare de Bouaké')
  })

  it('n\'interprète pas le HTML dans le titre (DOM sûr)', () => {
    const el = construirePopupContenu({
      titre: '<img src=x onerror=alert(1)>',
      ville: null, image: null, typeNom: null, typeCouleur: null,
    })
    // Le titre est posé via textContent : aucun <img> injecté.
    expect(el.querySelector('img')).toBeNull()
    expect(el.querySelector('strong')?.textContent).toBe('<img src=x onerror=alert(1)>')
  })
})
