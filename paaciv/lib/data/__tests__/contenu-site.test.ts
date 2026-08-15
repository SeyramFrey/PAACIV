import { describe, it, expect } from 'vitest'
import { texte, type Textes } from '@/lib/data/contenu-site'

const textes: Textes = {
  hero_titre: { fr: 'Ce qui tient debout', en: 'What still stands' },
  agenda_titre: { fr: 'Prochaines visites', en: null },
}

describe('texte', () => {
  it('renvoie la valeur dans la locale demandée', () => {
    expect(texte(textes, 'hero_titre', 'en')).toBe('What still stands')
    expect(texte(textes, 'hero_titre', 'fr')).toBe('Ce qui tient debout')
  })

  it('replie sur le français quand l’anglais manque', () => {
    expect(texte(textes, 'agenda_titre', 'en')).toBe('Prochaines visites')
  })

  it('renvoie une chaîne vide pour une clé absente, sans planter', () => {
    expect(texte(textes, 'cle_inexistante', 'fr')).toBe('')
  })
})
