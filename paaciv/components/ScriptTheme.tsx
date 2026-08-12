// Applique le thème mémorisé AVANT le premier rendu. Sans ce script inline,
// le document part en clair puis bascule en sombre à l'hydratation : un flash
// blanc plein écran très visible sur une page dont le hero est sombre.
export function ScriptTheme() {
  const code = `(function(){try{var t=localStorage.getItem('paaciv-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark')}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()`
  return <script dangerouslySetInnerHTML={{ __html: code }} />
}
