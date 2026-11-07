// Applique le thème mémorisé AVANT le premier rendu. Sans ce script inline,
// le document part dans un thème puis bascule à l'hydratation : un flash plein
// écran très visible.
// Le site s'ouvre en plein jour (décision du 7 novembre 2026) : la nuit n'est
// plus qu'un choix du visiteur, mémorisé par la bascule.
export function ScriptTheme() {
  const code = `(function(){try{var t=localStorage.getItem('paaciv-theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light')}catch(e){document.documentElement.setAttribute('data-theme','light')}})()`
  return <script dangerouslySetInnerHTML={{ __html: code }} />
}
