import { grouperBlocs, blocsVides, type BlocArchitecte } from '@/lib/data/architectes'
import { lignesDuNom } from '@/components/architectes/HeroFiche'

const bloc = (p: Partial<BlocArchitecte>): BlocArchitecte => ({
  id: p.id ?? 'x',
  bloc: p.bloc ?? 'programme',
  surtitre_fr: null,
  surtitre_en: null,
  titre_fr: p.titre_fr ?? 'T',
  titre_en: null,
  texte_fr: null,
  texte_en: null,
  ordre: p.ordre ?? 0,
})

test('grouperBlocs : range par type et trie par ordre, indépendamment entre types', () => {
  const g = grouperBlocs([
    bloc({ id: 'a', bloc: 'mission', titre_fr: 'M2', ordre: 2 }),
    bloc({ id: 'b', bloc: 'programme', titre_fr: 'P2', ordre: 2 }),
    bloc({ id: 'c', bloc: 'mission', titre_fr: 'M1', ordre: 1 }),
    bloc({ id: 'd', bloc: 'programme', titre_fr: 'P1', ordre: 1 }),
  ])
  expect(g.programme.map((b) => b.titre_fr)).toEqual(['P1', 'P2'])
  expect(g.mission.map((b) => b.titre_fr)).toEqual(['M1', 'M2'])
  expect(g.domaine).toEqual([])
})

test('grouperBlocs : une fiche sans bloc rend les quatre listes vides, jamais undefined', () => {
  // Le rendu fait `a.blocs.programme.length` sans garde : un `undefined` ici
  // ferait tomber la page entière au lieu de masquer une section.
  expect(grouperBlocs(null)).toEqual(blocsVides())
  expect(grouperBlocs([])).toEqual(blocsVides())
})

test('grouperBlocs : un type hors vocabulaire est ignoré, pas propagé', () => {
  const g = grouperBlocs([bloc({ bloc: 'inconnu' as BlocArchitecte['bloc'] })])
  expect(g).toEqual(blocsVides())
})

test('lignesDuNom : trois étages au plus, le reste rejoint la dernière ligne', () => {
  expect(lignesDuNom('Raymond Aka Adjo')).toEqual(['Raymond', 'Aka', 'Adjo'])
  expect(lignesDuNom('Michel Goly Kouassi')).toEqual(['Michel', 'Goly', 'Kouassi'])
  expect(lignesDuNom('Jean  Léon')).toEqual(['Jean', 'Léon'])
  expect(lignesDuNom('Adjo')).toEqual(['Adjo'])
  expect(lignesDuNom('Marie Antoinette de la Tour Blanche')).toEqual([
    'Marie',
    'Antoinette',
    'de la Tour Blanche',
  ])
})
