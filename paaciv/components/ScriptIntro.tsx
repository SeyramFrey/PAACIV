import { CLE_MODE_LEGER } from '@/lib/mode-leger'
import { CLE_INTRO_VUE } from '@/lib/intro'

// Pose l'état du film d'ouverture AVANT le premier rendu, comme ScriptTheme
// pour le thème : sans lui, un visiteur sans film le verrait jusqu'à
// l'hydratation. Monté dans le <head> de toutes les pages plutôt que
// par l'accueil : rendu par une page, il serait recréé côté client à chaque
// navigation interne, et React n'y exécute jamais un <script>.
// L'état vit sur <html data-intro> :
//   absent → le film va jouer, les entrées du hero attendent (globals.css) ;
//   "sans" → mouvement réduit, ou mode léger : pas de film ;
//   "fin"  → le film est fini ou passé.
// Déjà vu dans cet onglet (lib/intro.ts) : "sans" d'emblée. Il ne joue
// qu'une fois par onglet, et une actualisation ne le relance pas.
// Le mode léger se pose ici aussi, sur <html data-leger> : il suit la connexion
// (économie de données, 2G, 3G) sauf si le visiteur a choisi. Même règle que
// `modeLeger` dans lib/mode-leger.ts.
export function ScriptIntro() {
  const code = `(function(){var d=document.documentElement,c=navigator.connection,l=null,v=null,m;try{l=localStorage.getItem('${CLE_MODE_LEGER}')}catch(e){}try{v=sessionStorage.getItem('${CLE_INTRO_VUE}')}catch(e){}try{m=l==='oui'||(l!=='non'&&!!(c&&(c.saveData||/2g|3g/.test(c.effectiveType||''))));if(m)d.setAttribute('data-leger','');if(m||v==='oui'||matchMedia('(prefers-reduced-motion: reduce)').matches)d.setAttribute('data-intro','sans')}catch(e){}})()`
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
