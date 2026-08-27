// Lisière tissée : le bord fini d'un lé, posé verticalement contre une section.
//
// `SeparateurTisse` court dans le sens de la TRAME, entre deux sections. Celle-ci
// court dans le sens de la CHAÎNE, le long d'une section. Ce n'est pas la même
// bande tournée de 90° : les coutures y sont horizontales, parce que c'est la
// direction dans laquelle les lés sont cousus.
//
// Comme la bande, elle ne cite aucun motif nommé — seulement la géométrie du
// tissage aux bandes. La note de `app/globals.css` (section TISSAGE) dit
// pourquoi, et vaut ici mot pour mot.
//
// `aria-hidden` : ornement de mise en page, rien à annoncer.
export function LisiereTissee({
  cote = 'gauche',
  largeur = 22,
}: {
  cote?: 'gauche' | 'droite'
  /** En pixels. Une lisière large se lit comme un panneau, pas comme un bord. */
  largeur?: number
}) {
  return (
    <div
      aria-hidden="true"
      className={`lisiere-tissee pointer-events-none absolute inset-y-0 z-[1] select-none opacity-[0.16] ${
        cote === 'gauche' ? 'left-0' : 'right-0'
      }`}
      style={{ width: `${largeur}px` }}
    />
  )
}
