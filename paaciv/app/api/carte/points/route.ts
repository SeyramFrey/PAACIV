import type { NextRequest } from 'next/server'
import { pointsPublies } from '@/lib/data/patrimoine'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const points = await pointsPublies({
    type: sp.get('type') ?? undefined,
    programme: sp.get('programme') ?? undefined,
    district: sp.get('district') ?? undefined,
    epoque: sp.get('epoque') ?? undefined,
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
        titre_fr: p.titre_fr,
        titre_en: p.titre_en,
        ville: p.ville,
        image: p.image,
      },
    })),
  })
}
