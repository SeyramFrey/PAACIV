// Pose l'état du film d'ouverture AVANT le premier rendu, comme ScriptTheme
// pour le thème : sans lui, un visiteur sans film le verrait jusqu'à
// l'hydratation. Monté dans le <head> de toutes les pages plutôt que
// par l'accueil : rendu par une page, il serait recréé côté client à chaque
// navigation interne, et React n'y exécute jamais un <script>.
// L'état vit sur <html data-intro> :
//   absent → le film va jouer, les entrées du hero attendent (globals.css) ;
//   "sans" → mouvement réduit, ou connexion trop faible pour 4,5 Mo de film
//            (économie de données, 2G, 3G) : pas de film ;
//   "fin"  → le film est fini ou passé ; il rejouera à la prochaine arrivée
//            sur l'accueil, qu'on l'ait déjà vu ou non.
export function ScriptIntro() {
  const code = `(function(){var d=document.documentElement;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches||(navigator.connection&&(navigator.connection.saveData||/2g|3g/.test(navigator.connection.effectiveType||''))))d.setAttribute('data-intro','sans')}catch(e){}})()`
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: code }} />
      {/* Sans JavaScript, personne ne piloterait le film ni ne relancerait
          les entrées du hero. */}
      <noscript
        dangerouslySetInnerHTML={{
          __html: '<style>[data-intro-film]{display:none!important}[data-hero-intro] [data-drop]{animation-play-state:running!important}</style>',
        }}
      />
    </>
  )
}
