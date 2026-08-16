'use client'

import { useTranslations } from 'next-intl'
import { useSoutien } from '@/components/soutenir/ContexteSoutien'

// Transposition des lignes 389-398 de la référence de design.
//
// Deux désaccords maquette/brief relevés, tranchés en faveur de la maquette
// (contrainte globale : la maquette prime sur le brief pour un espacement ou
// une composition) :
//  - le facteur de parallaxe de l'image est `data-par="0.14"` dans la
//    maquette (ligne 390), et non `0.12` comme l'indiquait le brief ;
//  - le voile n'est PAS `var(--veil)` : la maquette pose ici un dégradé
//    propre à cette bande (ligne 391), plus sombre et plus opaque que le
//    token partagé — celui-là même que Hero.tsx réutilise ailleurs via
//    `var(--veil)`. Deux blocs voisins n'ont pas forcément le même filet
//    (piège relevé à la Task 11) ; on reprend donc la valeur littérale de la
//    maquette plutôt que le token.
export function AppelArchives({ texte }: { texte: string }) {
  const t = useTranslations('accueil')
  const { ouvrir } = useSoutien()

  return (
    <section className="relative grid h-[clamp(360px,42vw,540px)] place-items-center overflow-hidden text-center">
      <img
        data-par="0.14"
        src="https://commons.wikimedia.org/wiki/Special:FilePath/Basilique%20notre%20Dame%20de%20la%20Paix%20de%20Yamoussoukro%2020.jpg?width=1800"
        alt="Basilique Notre-Dame de la Paix, Yamoussoukro"
        className="absolute inset-x-0 -top-[10%] h-[120%] w-full object-cover"
        style={{ filter: 'var(--imgf)' }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, oklch(0.14 0.02 46 / 0.6), oklch(0.12 0.02 46 / 0.78))' }}
      />
      {/* Raccords en arc vers le fond de page : la bande plein cadre se fond
          dans var(--bg) au lieu de heurter les sections voisines par une
          arête franche, comme la maquette. */}
      <span
        aria-hidden="true"
        className="absolute -top-[90px] -left-[10%] h-[200px] w-[120%]"
        style={{ background: 'var(--bg)', borderRadius: '0 0 50% 50%' }}
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-[90px] -left-[10%] h-[200px] w-[120%]"
        style={{ background: 'var(--bg)', borderRadius: '50% 50% 0 0' }}
      />

      <div className="relative px-6" style={{ color: 'oklch(0.96 0.02 84)' }}>
        <h2
          data-rv=""
          className="m-0 text-balance font-serif text-[clamp(30px,4.4vw,66px)] leading-[1.1] tracking-[0.01em]"
        >
          {texte}
        </h2>
        <button
          type="button"
          onClick={() => ouvrir('archive')}
          data-rv=""
          data-d="120"
          className="mt-8 inline-block rounded-full px-[34px] py-4 text-[11px] font-semibold uppercase leading-none tracking-[0.2em] transition hover:-translate-y-[3px]"
          style={{ background: 'var(--terra)', color: 'oklch(0.98 0.01 84)' }}
        >
          {t('confierArchive')}
        </button>
      </div>
    </section>
  )
}
