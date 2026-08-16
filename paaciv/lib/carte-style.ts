// Style de fond partagé par la carte plein écran et l'aperçu de l'accueil.
// Extrait de CarteClient pour que les deux ne divergent jamais : un aperçu
// qui n'aurait pas le même fond que la carte réelle serait un mensonge visuel.
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY

export const STYLE_CARTE = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  : 'https://tiles.openfreemap.org/styles/liberty'

export const COULEUR_DEFAUT = '#8A3E1B'
