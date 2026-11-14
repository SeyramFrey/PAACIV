import type { ReactNode } from 'react'
import type { ZoneVisite } from '@/lib/etapes-visite'

// Une étape de la visite de l'accueil : l'ancre que vise le rail (`#carte`),
// et le repère qu'il observe pour savoir où en est le visiteur
// (`data-etape`). Une simple enveloppe, sans style : chaque section garde sa
// bande et ses marges.
export function Etape({ zone, children }: { zone: ZoneVisite; children: ReactNode }) {
  return (
    <div id={zone} data-etape={zone}>
      {children}
    </div>
  )
}
