'use client'

import { useSyncExternalStore } from 'react'
import { abonnerCarnet, lireCarnet, type Tampon } from '@/lib/carnet'

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
