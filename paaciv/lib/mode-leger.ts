// Mode léger : le choix du visiteur prime, sinon on suit sa connexion.
// `ScriptIntro` refait ce calcul avant le premier rendu, dans un script inline :
// toute règle changée ici doit l'être là-bas.
export const CLE_MODE_LEGER = 'paaciv-mode-leger'

export function modeLeger(choix: string | null, connexionFaible: boolean): boolean {
  if (choix === 'oui') return true
  if (choix === 'non') return false
  return connexionFaible
}
