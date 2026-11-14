'use client'

import { useState, type ReactNode } from 'react'
import { ViewTransition } from '@/lib/view-transition'
import { usePathname } from '@/i18n/navigation'

// Le repli de la transition vers la fiche : quand aucune vignette ni aucun
// éclat ne devient le haut de fiche (lien texte, fiche sans photo), la fiche
// apparaît en fondu.
//
// L'enveloppe est dans le layout, autour des pages, et réagit en « mise à
// jour » (`update`). Posée dans la page de la fiche en « entrée » (`enter`),
// elle ne se déclenchait jamais : mesuré le 14/11/2026, React ne voit pas
// l'insertion d'une page par le routeur de Next comme une entrée.
//
// La classe ne vaut que pour une navigation qui ARRIVE sur une fiche depuis
// une autre page. Partout ailleurs, `none` : aucun autre changement de page
// ne s'anime.
const FICHE = /\/patrimoine\/[^/]+$/

export function ArriveeFiche({ children }: { children: ReactNode }) {
  const chemin = usePathname()
  // Le chemin précédent, gardé en état et mis à jour pendant le rendu quand il
  // change (le schéma recommandé par React pour comparer à la valeur d'avant).
  const [precedent, setPrecedent] = useState(chemin)
  const [versFiche, setVersFiche] = useState(false)
  if (chemin !== precedent) {
    setPrecedent(chemin)
    setVersFiche(FICHE.test(chemin))
  }

  return (
    <ViewTransition default="none" update={versFiche ? 'fiche-fondu' : 'none'}>
      {children}
    </ViewTransition>
  )
}
