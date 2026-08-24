import type { NextRequest } from 'next/server'
import { pointsPublies } from '@/lib/data/patrimoine'
import { etatOuNull } from '@/lib/etats-conservation'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const points = await pointsPublies({
    type: sp.get('type') ?? undefined,
    programme: sp.get('programme') ?? undefined,
    district: sp.get('district') ?? undefined,
    epoque: sp.get('epoque') ?? undefined,
    // `?? undefined` et non `?? null` : une valeur hors vocabulaire est
    // ignorée (archive complète) plutôt que filtrée sur une catégorie
    // inexistante, qui rendrait une carte vide sans rien expliquer.
    etat: etatOuNull(sp.get('etat')) ?? undefined,
    q: sp.get('q') ?? undefined,
  })

  return Response.json({
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: {
        id: p.id,
        slug: p.slug,
        type_id: p.type_id,
        // Sert la bascule « lecture par état » de la carte : une propriété de
        // plus dans le GeoJSON coûte moins qu'un second appel réseau pour
        // recolorer exactement les mêmes points.
        etat_conservation: p.etat_conservation,
        titre_fr: p.titre_fr,
        titre_en: p.titre_en,
        ville: p.ville,
        image: p.image,
      },
    })),
  })
}
