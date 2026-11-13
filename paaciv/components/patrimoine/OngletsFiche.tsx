'use client'

import { useEffect, useId, useRef, useState, type ReactNode, type KeyboardEvent } from 'react'

export type Onglet = { id: string; libelle: string; contenu: ReactNode }

// Onglets de la fiche bâtiment : « Présentation », « Photographies et état
// actuel », « Documentation » (révision de l'association, 13/11/2026).
//
// Les trois panneaux sont rendus par le SERVEUR et tous présents dans le HTML ;
// seuls les inactifs portent `hidden`. Les moteurs de recherche et l'impression
// lisent donc toute la fiche, et ce composant ne fait que basculer un attribut.
//
// Chaque onglet a son adresse (`#etat-actuel`, `#documentation`) : un lien
// envoyé par l'association ouvre directement le bon panneau.
//
// Motif ARIA « tabs » à activation automatique : les flèches gauche et droite,
// Début et Fin déplacent l'onglet actif ; un seul onglet est dans l'ordre de
// tabulation.
export function OngletsFiche({ onglets, libelle }: { onglets: Onglet[]; libelle: string }) {
  const base = useId()
  const [actif, setActif] = useState(onglets[0]?.id)
  const boutons = useRef<Record<string, HTMLButtonElement | null>>({})

  // L'ancre de l'adresse choisit l'onglet à l'arrivée, et quand elle change
  // (lien interne, bouton « précédent » du navigateur).
  useEffect(() => {
    const lire = () => {
      const ancre = decodeURIComponent(window.location.hash.slice(1))
      if (onglets.some((o) => o.id === ancre)) setActif(ancre)
    }
    lire()
    window.addEventListener('hashchange', lire)
    return () => window.removeEventListener('hashchange', lire)
  }, [onglets])

  function choisir(id: string, focus = false) {
    setActif(id)
    // `replaceState` et non `location.hash = …` : changer d'onglet ne doit ni
    // faire défiler la page jusqu'au panneau, ni empiler une entrée
    // d'historique par clic.
    const url = id === onglets[0]?.id ? window.location.pathname + window.location.search : `#${id}`
    window.history.replaceState(null, '', url)
    if (focus) boutons.current[id]?.focus()
  }

  function clavier(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const dernier = onglets.length - 1
    const cible =
      e.key === 'ArrowRight' ? (index === dernier ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? dernier : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? dernier
      : null
    if (cible === null) return
    e.preventDefault()
    choisir(onglets[cible].id, true)
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={libelle}
        // Les onglets passent à la ligne plutôt que de défiler : sur un
        // téléphone, « Documentation » sortait de l'écran, et rien n'indiquait
        // qu'il fallait faire glisser la barre pour le trouver.
        className="mb-8 flex flex-wrap gap-x-1 border-b border-filet"
      >
        {onglets.map((o, i) => {
          const selectionne = o.id === actif
          return (
            <button
              key={o.id}
              ref={(el) => {
                boutons.current[o.id] = el
              }}
              type="button"
              role="tab"
              id={`${base}-onglet-${o.id}`}
              aria-selected={selectionne}
              aria-controls={`${base}-panneau-${o.id}`}
              tabIndex={selectionne ? 0 : -1}
              onClick={() => choisir(o.id)}
              onKeyDown={(e) => clavier(e, i)}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors sm:px-4 ${
                selectionne ? 'border-ocre text-ocre' : 'border-transparent text-doux hover:text-encre-t'
              }`}
            >
              {o.libelle}
            </button>
          )
        })}
      </div>
      {onglets.map((o) => (
        <div
          key={o.id}
          role="tabpanel"
          id={`${base}-panneau-${o.id}`}
          aria-labelledby={`${base}-onglet-${o.id}`}
          hidden={o.id !== actif}
          // Le panneau reçoit le focus au clavier : sans contenu focalisable en
          // tête, la touche Tab sauterait sinon par-dessus tout le panneau.
          tabIndex={0}
          data-testid={`panneau-${o.id}`}
          className="focus-visible:outline-none"
        >
          {o.contenu}
        </div>
      ))}
    </div>
  )
}
