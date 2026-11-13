// Le film d'ouverture ne joue qu'une fois par onglet (décision de Sey du
// 13/11/2026, qui remplace celle du 23/10 : « il rejoue à chaque arrivée »).
// Une actualisation ou un retour sur l'accueil ne le relancent plus ; un nouvel
// onglet, ou une nouvelle visite, si. D'où le `sessionStorage`, qui vit
// exactement le temps d'un onglet et survit à l'actualisation.
//
// `ScriptIntro` relit cette clé avant le premier rendu, dans un script inline :
// toute règle changée ici doit l'être là-bas.
export const CLE_INTRO_VUE = 'paaciv-intro-vue'

export function introDejaVue(): boolean {
  try {
    return window.sessionStorage.getItem(CLE_INTRO_VUE) === 'oui'
  } catch {
    // Stockage refusé : on ne sait pas, le film joue comme avant.
    return false
  }
}

export function marquerIntroVue() {
  try {
    window.sessionStorage.setItem(CLE_INTRO_VUE, 'oui')
  } catch {
    // Stockage refusé : le film rejouera à la prochaine arrivée, rien de plus.
  }
}
