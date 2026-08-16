import { describe, it, expect, afterEach } from 'vitest'
import { formaterDate } from '@/components/accueil/Agenda'

// `formaterDate` est la seule fonction pure non triviale du composant : le
// `timeZone: 'UTC'` qu'elle pose sur `Intl.DateTimeFormat` est présenté comme
// « indispensable » dans son commentaire — ces tests vérifient que retirer
// cette option ferait échouer le troisième cas.
describe('formaterDate', () => {
  const TZ_ORIGINAL = process.env.TZ

  afterEach(() => {
    process.env.TZ = TZ_ORIGINAL
  })

  it('formate une date normale au format JJ.MM', () => {
    expect(formaterDate('2026-09-12', 'fr')).toBe('12.09')
  })

  it('garde le séparateur « . » en anglais, où Intl utiliserait « / »', () => {
    expect(formaterDate('2026-09-12', 'en')).toBe('12.09')
  })

  it('ne bascule pas de jour selon le fuseau du serveur', () => {
    // `Etc/GMT+12` (UTC-12) est le fuseau qui ferait le plus reculer une date
    // interprétée sans `timeZone: 'UTC'` explicite : minuit UTC du 1er
    // janvier y est encore le 31 décembre, douze heures plus tôt. Sans
    // `timeZone: 'UTC'`, ce test échouerait avec « 31.12 ».
    process.env.TZ = 'Etc/GMT+12'
    expect(formaterDate('2026-01-01', 'fr')).toBe('01.01')
  })
})
