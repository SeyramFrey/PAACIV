// Suite de valeurs affichées par un compteur animé. Extrait dans un module
// pur pour être testable sans DOM : la logique d'easing est la seule partie
// du moteur d'animation où une erreur passerait inaperçue à l'œil.
export function paliersCompteur(cible: number, etapes: number): number[] {
  const out: number[] = []
  for (let i = 0; i <= etapes; i++) {
    const t = i / etapes
    // Easing out cubique : démarrage rapide, arrivée douce sur la cible.
    const eased = 1 - Math.pow(1 - t, 3)
    out.push(Math.round(cible * eased))
  }
  // Le dernier palier doit valoir exactement la cible, quel qu'ait été
  // l'arrondi : un compteur qui s'arrête sur 1239 au lieu de 1240 est un bug
  // visible.
  out[out.length - 1] = cible
  return out
}
