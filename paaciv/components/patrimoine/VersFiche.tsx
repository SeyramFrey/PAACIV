'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ViewTransition } from '@/lib/view-transition'
import { flushSync } from 'react-dom'

// Transition « vignette → haut de fiche » (moodboard du 13/11/2026, Southern
// Guild) : la photo cliquée grandit jusqu'à devenir le haut de la fiche, avec
// son crédit (voir `Galerie`).
//
// Le nom de transition n'est posé que sur la vignette CLIQUÉE, au moment du
// clic. Une page d'archive porte des dizaines de vignettes, et la même fiche
// peut y figurer deux fois (la grille de l'accueil et l'éléphant, par
// exemple) : deux éléments du même nom annulent la transition. Nommées à la
// demande, il n'y en a jamais qu'une.
//
// Navigateur sans View Transitions, ou fiche sans photo : la page change sans
// morphose, et la fiche apparaît en fondu (`page.tsx`).

/** Le nom partagé entre une vignette (ou un éclat) et le haut de sa fiche. */
export function nomTransitionFiche(slug: string) {
  return `fiche-${slug}`
}

export function VersFiche({
  slug,
  className,
  style,
  children,
}: {
  slug: string
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const boite = useRef<HTMLDivElement>(null)
  const [actif, setActif] = useState(false)

  useEffect(() => {
    // Le lien est rendu par le parent (souvent un composant serveur, qui ne
    // peut pas passer de gestionnaire) : on écoute son clic directement.
    // L'écouteur natif passe AVANT celui de React, branché à la racine : le
    // nom est posé avant que la navigation ne photographie l'ancienne page.
    const lien = boite.current?.closest('a')
    if (!lien) return
    const auClic = (e: MouseEvent) => {
      // Nouvel onglet, nouvelle fenêtre : rien ne se passe sur cette page.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      flushSync(() => setActif(true))
    }
    lien.addEventListener('click', auClic)
    // Repère pour les tests : avant ce point (clic pendant le chargement), la
    // fiche s'ouvre en fondu, sans morphose.
    lien.dataset.versFiche = 'pret'
    return () => lien.removeEventListener('click', auClic)
  }, [])

  return (
    <ViewTransition name={actif ? nomTransitionFiche(slug) : undefined} share="fiche" default="none">
      <div ref={boite} className={className} style={style}>
        {children}
      </div>
    </ViewTransition>
  )
}
