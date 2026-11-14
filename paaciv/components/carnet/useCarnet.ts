'use client'

import { useSyncExternalStore } from 'react'
import { abonnerCarnet, carnetCommence, lireCarnet, type Tampon } from '@/lib/carnet'

const VIDE: Tampon[] = []

/**
 * Le carnet du visiteur, tenu à jour dans l'onglet courant comme dans les
 * autres. Côté serveur, et au premier rendu d'hydratation, il est vide : le
 * stockage local n'existe que dans le navigateur, et lire autre chose que le
 * rendu serveur à l'hydratation casserait la page.
 */
export function useCarnet(): Tampon[] {
  return useSyncExternalStore(abonnerCarnet, lireCarnet, () => VIDE)
}

/**
 * Le carnet est-il commencé ? `null` tant qu'on ne le sait pas (rendu serveur,
 * hydratation) : on n'affiche alors ni l'invitation ni la marque, pour ne pas
 * montrer « Commencer » une fraction de seconde à qui l'a déjà fait.
 */
export function useCarnetCommence(): boolean | null {
  return useSyncExternalStore(abonnerCarnet, carnetCommence, () => null)
}
