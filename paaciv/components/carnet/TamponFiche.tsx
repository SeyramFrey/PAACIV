'use client'

import { useEffect } from 'react'
import { tamponner } from '@/lib/carnet'

// Posé sur chaque fiche bâtiment publiée : l'ouvrir suffit à laisser son tampon
// dans le carnet du visiteur. Ne rend rien : le compteur de l'en-tête, qui se
// met à jour aussitôt, est le seul signe visible.
export function TamponFiche({ slug }: { slug: string }) {
  useEffect(() => {
    tamponner(slug)
  }, [slug])
  return null
}
