// Style de fond partagé par la carte plein écran et l'aperçu de l'accueil.
// Extrait de CarteClient pour que les deux ne divergent jamais : un aperçu
// qui n'aurait pas le même fond que la carte réelle serait un mensonge visuel.
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY

// Fond libre, sans clé ni quota. Il sert de repli à DEUX titres désormais :
// quand aucune clé MapTiler n'est configurée, et quand la clé existe mais que
// MapTiler la refuse (voir `styleDisponible`).
export const STYLE_REPLI = 'https://tiles.openfreemap.org/styles/liberty'

export const STYLE_CARTE = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  : STYLE_REPLI

// Une clé MapTiler est restreinte PAR ORIGINE. Celle du projet autorise le
// développement local mais pas `staging.paaciv.com` : la préproduction recevait
// donc un 403 sur le style, et la carte restait un rectangle vide — sans un mot
// dans la console, l'écouteur d'erreurs de `CarteClient` étant volontairement
// muet pour taire les annulations de requêtes.
//
// Une carte qui disparaît parce qu'un tiers refuse une clé est un mauvais mode
// de défaillance : le repli existait déjà pour l'absence de clé, il couvre
// maintenant aussi son rejet. La réponse est mise en cache par le navigateur,
// et MapLibre refait la même requête juste après : le coût réel est nul.
//
// Le correctif DURABLE reste d'ajouter le domaine aux origines autorisées de la
// clé, côté compte MapTiler — ce repli garantit seulement qu'une carte s'affiche
// en attendant, et le jour où une clé expire.
export async function styleDisponible(): Promise<string> {
  if (STYLE_CARTE === STYLE_REPLI) return STYLE_REPLI
  try {
    const r = await fetch(STYLE_CARTE)
    if (r.ok) return STYLE_CARTE
    console.warn(
      `[carte] MapTiler a refusé le style (${r.status}) sur cette origine ; repli sur OpenFreeMap.`,
    )
  } catch {
    // Réseau injoignable : le repli n'ira pas plus loin, mais il ne coûte rien
    // d'essayer plutôt que de rendre une carte vide.
  }
  return STYLE_REPLI
}

// Couleur d'un point dont le type n'a pas de couleur en base. Le brun de la
// palette « Matières » (identique à `--color-brun`) : un point de carte est
// évalué par WebGL, hors du document, et ne peut donc pas lire un jeton CSS.
export const COULEUR_DEFAUT = '#7E3F20'
