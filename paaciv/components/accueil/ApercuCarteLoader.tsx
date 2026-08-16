'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { ApercuCarte as ApercuCarteType } from '@/components/accueil/ApercuCarte'

// `ssr: false` n'est permis par `next/dynamic` que dans un Composant Client —
// ce fichier existe pour porter cette frontière : `app/[locale]/page.tsx`
// est un Composant Serveur, il ne peut pas appeler `dynamic(..., { ssr:
// false })` directement.
//
// MapLibre pèse 785 Ko et la carte n'est que décorative sur la page la plus
// visitée du site : sans ce découplage, le chunk était référencé par le
// bundle client de la route d'accueil et la carte s'initialisait au montage,
// que le visiteur y arrive ou non. `ApercuCarte` gère en interne le second
// volet (ne monter la carte MapLibre qu'à l'intersection avec le viewport).
const ApercuCarte = dynamic(
  () => import('@/components/accueil/ApercuCarte').then((mod) => mod.ApercuCarte),
  { ssr: false },
)

export function ApercuCarteLoader(props: ComponentProps<typeof ApercuCarteType>) {
  return <ApercuCarte {...props} />
}
