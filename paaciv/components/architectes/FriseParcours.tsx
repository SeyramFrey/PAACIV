import { getTranslations } from 'next-intl/server'
import { TexteRiche } from '@/components/patrimoine/TexteRiche'
import { decouperParcours } from '@/lib/parcours'

// Le parcours en frise (maquette, section `#parcours`) : une colonne d'années
// à gauche, l'étape à droite, un filet entre chacune.
//
// La donnée n'est pas structurée — c'est le champ riche de l'admin — et
// `decouperParcours` la relit. Quand elle ne dessine pas une chronologie
// franche, ce composant REND LE TEXTE RICHE tel quel, dans la même section et
// sous le même titre : la fiche d'un architecte dont le parcours est rédigé en
// prose reste lisible, elle n'affiche simplement pas de frise. C'est ce repli
// qui autorise la lecture opportuniste ci-dessus sans rien risquer.
export async function FriseParcours({
  html,
  id,
}: {
  html: string | null
  id: string
}) {
  const t = await getTranslations('ficheArchitecte')
  const parcours = decouperParcours(html)

  return (
    <section
      id={id}
      className="scroll-mt-[calc(var(--hauteur-entete)+3.5rem)] px-[clamp(20px,4vw,54px)] py-[clamp(56px,7vw,110px)]"
      style={{ background: 'var(--bg2)' }}
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-[clamp(28px,4vw,56px)] flex flex-wrap items-end justify-between gap-6">
          <h2
            data-rv=""
            className="m-0 font-serif text-[clamp(30px,3.4vw,52px)] leading-[1.04] tracking-[-0.02em]"
            style={{ color: 'var(--ink)' }}
          >
            {t('parcours')}
          </h2>
          {parcours && (
            <p
              data-rv=""
              data-d="80"
              className="m-0 text-[10px] font-medium uppercase leading-[1.8] tracking-[0.2em]"
              style={{ color: 'var(--soft)' }}
            >
              {parcours.etapes[0].annee} → {parcours.etapes[parcours.etapes.length - 1].annee}
            </p>
          )}
        </div>

        {parcours ? (
          <>
            {parcours.intro.map((p, i) => (
              <p
                key={i}
                data-rv=""
                className="m-0 mb-4 max-w-[70ch] text-base font-light leading-[1.85]"
                style={{ color: 'var(--soft)' }}
              >
                {p}
              </p>
            ))}
            <ol className="m-0 grid list-none gap-0 p-0">
              {parcours.etapes.map((e, i) => (
                <li
                  key={`${e.annee}-${i}`}
                  data-rv=""
                  // Le décalage de la maquette (60 ms par ligne) est plafonné :
                  // au-delà d'une dizaine d'étapes, la dernière n'apparaîtrait
                  // qu'une seconde après la première, bien après que l'œil y
                  // soit arrivé.
                  data-d={String(Math.min(i * 60, 480))}
                  className="grid gap-[clamp(14px,3vw,44px)] border-t py-5 transition-colors duration-300 [grid-template-columns:minmax(110px,150px)_minmax(0,1fr)] hover:bg-fond3 last:border-b"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <span
                    className="font-serif text-[clamp(20px,2vw,28px)] leading-none"
                    style={{ color: 'var(--terra)' }}
                  >
                    {e.annee}
                  </span>
                  <span className="text-base font-light leading-[1.6]" style={{ color: 'var(--ink)' }}>
                    {e.texte}
                    {e.precisions.map((p, j) => (
                      <span key={j} className="block text-sm" style={{ color: 'var(--soft)' }}>
                        {p}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <div data-rv="" className="max-w-[70ch]">
            <TexteRiche html={html ?? ''} />
          </div>
        )}
      </div>
    </section>
  )
}
