import type { CSSProperties } from 'react'
import { getLocale } from 'next-intl/server'
import { champ } from '@/lib/i18n-champ'
import type { PointCle } from '@/lib/data/accueil'

// Chaque filet porte une forme distincte dans la maquette (losange, cercle,
// carré, goutte) : ne pas généraliser un rayon à ses voisins (piège relevé
// à la Task 10).
const FORMES: CSSProperties[] = [
  { transform: 'rotate(45deg)' },
  { borderRadius: '50%' },
  {},
  { borderRadius: '50% 0 50% 0' },
]

// Délais échelonnés de la maquette (lignes 249-264 de la référence de
// design) : 0 (implicite), 80, 160, 240 ms — au-delà de quatre entrées, les
// suivantes se révèlent sans délai plutôt que d'inventer une valeur absente
// de la maquette.
const DELAIS: (string | undefined)[] = [undefined, '80', '160', '240']

export async function PourquoiNousSuivre({ points, titre }: { points: PointCle[]; titre: string }) {
  // Aucun point clé publié : le bloc entier disparaît plutôt que d'afficher
  // un titre suivi d'une grille vide.
  if (points.length === 0) return null

  const locale = await getLocale()

  return (
    <section className="px-[clamp(20px,5vw,80px)] pt-[clamp(40px,5vw,80px)] pb-[clamp(60px,7vw,110px)]">
      <div className="mx-auto max-w-[1440px]">
        <h3
          data-rv=""
          className="m-0 mb-10 font-serif text-[clamp(26px,2.8vw,40px)] leading-[1.1]"
          style={{ color: 'var(--ink)' }}
        >
          {titre}
        </h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[clamp(20px,2.4vw,40px)]">
          {points.map((p, i) => (
            <div
              key={p.id}
              data-rv=""
              data-d={DELAIS[i]}
              className="border-t pt-[22px]"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="m-0 text-[15px] font-medium leading-[1.3]" style={{ color: 'var(--ink)' }}>
                  {champ(p.titre_fr, p.titre_en, locale)}
                </p>
                <span
                  aria-hidden="true"
                  className="h-[18px] w-[18px] flex-none border"
                  style={{ borderColor: 'var(--ocre)', ...FORMES[i % FORMES.length] }}
                />
              </div>
              <p className="mt-3 text-sm font-light leading-[1.7]" style={{ color: 'var(--soft)' }}>
                {champ(p.texte_fr, p.texte_en, locale)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
