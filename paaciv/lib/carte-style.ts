// Style de fond partagé par la carte plein écran et l'aperçu de l'accueil.
// Extrait de CarteClient pour que les deux ne divergent jamais : un aperçu
// qui n'aurait pas le même fond que la carte réelle serait un mensonge visuel.
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY

export const STYLE_CARTE = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  : 'https://tiles.openfreemap.org/styles/liberty'

// Couleur d'un point dont le type n'a pas de couleur en base. Le brun de la
// palette « Matières » (identique à `--color-brun`) : un point de carte est
// évalué par WebGL, hors du document, et ne peut donc pas lire un jeton CSS.
export const COULEUR_DEFAUT = '#7E3F20'
