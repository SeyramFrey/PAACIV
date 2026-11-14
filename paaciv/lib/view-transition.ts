import * as React from 'react'
import type { ComponentType, ReactNode, ViewTransitionProps } from 'react'

// `<ViewTransition>` de React, avec un repli.
//
// Dans l'application, `react` est la version que Next embarque, qui contient
// `ViewTransition`. Le paquet `react` stable (19.2), celui des tests unitaires
// (Vitest), ne l'a pas encore : sans repli, tout composant qui l'utilise
// plante au rendu. Le repli rend ses enfants tels quels, c'est-à-dire
// exactement ce que fait un navigateur sans View Transitions.
const Natif = (React as unknown as { ViewTransition?: ComponentType<ViewTransitionProps> }).ViewTransition

function SansTransition({ children }: { children?: ReactNode }) {
  return children
}

export const ViewTransition: ComponentType<ViewTransitionProps> = Natif ?? SansTransition
