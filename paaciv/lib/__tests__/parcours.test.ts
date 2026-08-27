import { decouperParcours } from '@/lib/parcours'

// Le parcours d'Aka Adjo, tel qu'il est réellement en base : des <p> plats,
// dont certains portent une année et d'autres prolongent le précédent.
const PARCOURS_ADJO = [
  '<p>1947 : CEPE bourse d(étude secondaire à Daloa</p>',
  "<p>1957-1958 : service militaire au bataillon autonome de la côte d'ivoire BACI Bouaké</p>",
  "<p>grade : sergent dans l'armée française</p>",
  "<p>1964 - 1969 : directeur national de l'habitat et de l'urbanisme de cote d'ivoire </p>",
  "<p>1969 : Architecte privé , fondateur de l'ATELIER D'ARCHITECTURE ET D'URBANISME SARL </p>",
  "<p>RC.N'3179</p>",
  '<p>CC. 7 305 497 W</p>',
].join('')

test('decouperParcours : une année, un tiret d’intervalle, un deux-points', () => {
  const r = decouperParcours(PARCOURS_ADJO)!
  expect(r.etapes.map((e) => e.annee)).toEqual(['1947', '1957-1958', '1964 - 1969', '1969'])
  expect(r.etapes[0].texte).toBe('CEPE bourse d(étude secondaire à Daloa')
})

test('decouperParcours : un paragraphe sans année prolonge l’étape précédente', () => {
  const r = decouperParcours(PARCOURS_ADJO)!
  expect(r.etapes[1].precisions).toEqual(["grade : sergent dans l'armée française"])
  // Deux précisions d'affilée s'accumulent sur la même étape.
  expect(r.etapes[3].precisions).toEqual(["RC.N'3179", 'CC. 7 305 497 W'])
})

test('decouperParcours : « 1960 : école … : certificat » ne coupe qu’au PREMIER deux-points', () => {
  const r = decouperParcours('<p>1960 : école des TP paris : certificat</p><p>1964 : DESA</p>')!
  expect(r.etapes[0].texte).toBe('école des TP paris : certificat')
})

test('decouperParcours : les paragraphes AVANT la première année sont rendus à part', () => {
  const r = decouperParcours('<p>Formation</p><p>1947 : CEPE</p><p>1952 : BEPC</p>')!
  expect(r.intro).toEqual(['Formation'])
  expect(r.etapes).toHaveLength(2)
})

test('decouperParcours : le balisage interne est réduit en texte simple', () => {
  const r = decouperParcours('<p>1947 : <strong>CEPE</strong> &amp; BEPC</p><p>1952 : X</p>')!
  expect(r.etapes[0].texte).toBe('CEPE & BEPC')
})

test('decouperParcours : sans chronologie franche, on renonce (repli sur le texte riche)', () => {
  // Une seule étape ne fait pas une frise : le rendu riche d'origine dit mieux.
  expect(decouperParcours('<p>1947 : CEPE</p>')).toBeNull()
  expect(decouperParcours('<p>Un paragraphe libre.</p><p>Un autre.</p>')).toBeNull()
  expect(decouperParcours(null)).toBeNull()
  expect(decouperParcours('')).toBeNull()
})
