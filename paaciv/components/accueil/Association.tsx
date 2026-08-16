import { getLocale } from 'next-intl/server'
import { texte, type Textes } from '@/lib/data/contenu-site'
import { Compteurs } from '@/components/accueil/Compteurs'
import { CartesSoutien } from '@/components/accueil/CartesSoutien'
import type { Chiffres } from '@/lib/data/accueil'

export async function Association({
  textes,
  chiffres,
  montant,
}: {
  textes: Textes
  chiffres: Chiffres
  montant: string
}) {
  const locale = await getLocale()
  const surtitre = texte(textes, 'association_surtitre', locale)
  const titre = texte(textes, 'association_titre', locale)
  const intro = texte(textes, 'association_texte', locale)

  return (
    <section
      id="association"
      className="pt-[clamp(90px,10vw,160px)] pr-[clamp(20px,5vw,80px)] pb-[clamp(50px,6vw,90px)] pl-[clamp(20px,5vw,80px)]"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mx-auto max-w-[860px] text-center">
          <p
            data-rv=""
            className="mb-5 text-[11px] font-medium uppercase tracking-[0.3em]"
            style={{ color: 'var(--ocre)' }}
          >
            {surtitre}
          </p>
          <h2
            data-rv=""
            data-d="80"
            className="m-0 text-balance font-serif text-[clamp(38px,5.6vw,86px)] leading-none tracking-[-0.02em]"
            style={{ color: 'var(--ink)' }}
          >
            {titre}
          </h2>
          <p
            data-rv=""
            data-d="160"
            className="mx-auto mt-[26px] max-w-[660px] text-[17px] font-light leading-[1.8]"
            style={{ color: 'var(--soft)' }}
          >
            {intro}
          </p>
          <div data-rv="" data-d="220" className="mt-[52px]">
            <Compteurs chiffres={chiffres} />
          </div>
        </div>

        <CartesSoutien montant={montant} />
      </div>
    </section>
  )
}
