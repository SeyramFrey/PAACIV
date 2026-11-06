// Carte des rubriques de l'administration : UNE seule source pour la barre
// latérale et le tableau de bord, qui ne peuvent ainsi pas se désaccorder.
//
// `espace` est l'espace de traduction de la rubrique. Le libellé de navigation
// est son `titre`, celui-là même qu'affiche le <h1> de l'écran : ce qu'on
// clique et ce sur quoi on arrive portent le même nom, et rien n'est à
// retraduire.
export type Rubrique = { href: string; espace: string }
export type GroupeRubriques = { cle: string; rubriques: readonly Rubrique[] }

export const TABLEAU_DE_BORD: Rubrique = { href: '/admin', espace: 'admin' }

// L'ordre suit la fréquence d'usage : le fonds d'abord, ce qu'on publie
// ensuite, le réglage des pages, puis ce que le public envoie.
export const GROUPES_RUBRIQUES: readonly GroupeRubriques[] = [
  {
    cle: 'inventaire',
    rubriques: [
      { href: '/admin/patrimoine', espace: 'adminPatrimoine' },
      { href: '/admin/architectes', espace: 'adminArchitectes' },
    ],
  },
  {
    cle: 'publications',
    rubriques: [
      { href: '/admin/articles', espace: 'adminArticles' },
      { href: '/admin/reportages', espace: 'adminReportages' },
      { href: '/admin/evenements', espace: 'adminEvenements' },
    ],
  },
  {
    cle: 'pages',
    rubriques: [
      { href: '/admin/contenu', espace: 'adminContenu' },
      { href: '/admin/medias', espace: 'adminMedias' },
      { href: '/admin/points-cles', espace: 'adminPointsCles' },
      { href: '/admin/activites', espace: 'adminActivites' },
      { href: '/admin/temoignages', espace: 'adminTemoignages' },
    ],
  },
  {
    cle: 'contacts',
    rubriques: [
      { href: '/admin/demandes', espace: 'adminDemandes' },
      { href: '/admin/abonnes', espace: 'adminAbonnes' },
    ],
  },
]

// Une rubrique reste active sur ses sous-écrans (`/admin/patrimoine/12`). Le
// tableau de bord fait exception : `/admin` préfixe toutes les autres
// rubriques, il ne serait sinon jamais inactif. Le `/` final du test évite
// qu'une rubrique s'allume pour une voisine au nom plus long.
export function estActive(chemin: string, href: string) {
  if (chemin === href) return true
  return href !== TABLEAU_DE_BORD.href && chemin.startsWith(`${href}/`)
}

export function rubriqueCourante(chemin: string) {
  return [TABLEAU_DE_BORD, ...GROUPES_RUBRIQUES.flatMap((g) => g.rubriques)].find((r) =>
    estActive(chemin, r.href),
  )
}
