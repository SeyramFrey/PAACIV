// Maquettes 3D publiées dans `public/3d`, par slug de fiche patrimoine.
const MAQUETTES: Record<string, string> = {
  'hotel-du-district-d-abidjan': '/3d/hotel-du-district',
}

export function maquette3d(slug: string): string | null {
  return MAQUETTES[slug] ?? null
}
