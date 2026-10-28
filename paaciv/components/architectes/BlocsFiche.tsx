import { getTranslations } from 'next-intl/server'
import { champ } from '@/lib/i18n-champ'
import type { BlocArchitecte } from '@/lib/data/architectes'

// Les deux sections de listes de la maquette : « Domaines d'intervention » sur
// fond sombre (section `#domaines`), et « À l'étranger » en cartes
// inclinables (section `#etranger`).
//
// La liste « Programmes à son actif » qui partageait la section sombre en a
// été retirée à la demande du client : les programmes se lisent désormais sur
// les réalisations elles-mêmes, dans la bande de filtre de la mosaïque (voir
// `MosaiqueRealisations`). Les blocs `programme` restent en base et dans
// l'admin, ils ne sont simplement plus rendus.
//
// Chacune ne s'affiche que si elle a de quoi. Une fiche sans blocs rend
// exactement les mêmes sections qu'avant — biographie, parcours, réalisations —
// et le gabarit vaut alors pour les sept architectes du corpus, pas seulement
// pour celui dont on tient les pièces d'agence.

export async function DomainesIntervention({
  domaines,
  locale,
  id,
}: {
  domaines: BlocArchitecte[]
  locale: string
  id: string
}) {
  const t = await getTranslations('ficheArchitecte')
  if (domaines.length === 0) return null

  return (
    <section
      id={id}
      className="scroll-mt-[calc(var(--hauteur-entete)+3.5rem)] px-[clamp(20px,4vw,54px)] py-[clamp(56px,7vw,110px)]"
      style={{ background: 'var(--deep)', color: 'var(--onDeep)' }}
    >
      <div className="mx-auto max-w-[1440px]">
        <h2
          data-rv=""
          className="m-0 mb-[clamp(28px,4vw,52px)] font-serif text-[clamp(30px,3.4vw,52px)] leading-[1.04] tracking-[-0.02em]"
        >
          {t('domaines')}
        </h2>
        <div className="grid gap-x-[clamp(28px,4vw,70px)] gap-y-[26px] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
          {domaines.map((d, i) => (
            <div
              key={d.id}
              data-rv=""
              data-d={String(Math.min(i * 70, 420))}
              className="grid items-start gap-4 [grid-template-columns:36px_minmax(0,1fr)]"
            >
              {/* Numérotation dérivée du rang, pas saisie : réordonner les
                  domaines dans l'admin ne doit pas obliger à renuméroter. */}
              <span
                aria-hidden="true"
                className="font-serif text-[22px] leading-none"
                style={{ color: 'var(--accent)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>
                <span className="block text-sm font-semibold uppercase leading-[1.4] tracking-[0.06em]">
                  {champ(d.titre_fr, d.titre_en, locale)}
                </span>
                {champ(d.texte_fr, d.texte_en, locale) && (
                  <span
                    className="mt-1.5 block text-sm font-light leading-[1.7]"
                    style={{ color: 'color-mix(in oklab, var(--onDeep) 72%, transparent)' }}
                  >
                    {champ(d.texte_fr, d.texte_en, locale)}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export async function MissionsEtranger({
  missions,
  locale,
  id,
}: {
  missions: BlocArchitecte[]
  locale: string
  id: string
}) {
  const t = await getTranslations('ficheArchitecte')
  if (missions.length === 0) return null

  return (
    <section
      id={id}
      className="relative scroll-mt-[calc(var(--hauteur-entete)+3.5rem)] overflow-hidden px-[clamp(20px,4vw,54px)] py-[clamp(56px,7vw,110px)]"
      style={{ background: 'var(--bg2)' }}
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-[clamp(28px,4vw,52px)] flex items-center gap-[18px]">
          <h2
            data-rv=""
            className="m-0 font-serif text-[clamp(30px,3.6vw,56px)] leading-none tracking-[-0.02em]"
            style={{ color: 'var(--ink)' }}
          >
            {t('missions')}
          </h2>
          <span
            data-line=""
            data-d="80"
            className="h-px flex-1"
            style={{ background: 'var(--line)' }}
          />
        </div>
        <div className="grid gap-[clamp(16px,2vw,28px)] [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
          {missions.map((m, i) => (
            <div
              key={m.id}
              data-rv=""
              data-d={String(Math.min(i * 90, 450))}
              data-tilt=""
              className="flex min-h-[250px] flex-col gap-[18px] border p-[clamp(22px,2.6vw,34px)] transition-[transform,border-color] duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] hover:border-ocre"
              style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}
            >
              {champ(m.surtitre_fr, m.surtitre_en, locale) && (
                <span
                  className="text-[10px] font-semibold uppercase leading-none tracking-[0.22em]"
                  style={{ color: 'var(--ocre)' }}
                >
                  {champ(m.surtitre_fr, m.surtitre_en, locale)}
                </span>
              )}
              <p
                className="m-0 font-serif text-[clamp(20px,2vw,28px)] leading-[1.2]"
                style={{ color: 'var(--ink)' }}
              >
                {champ(m.titre_fr, m.titre_en, locale)}
              </p>
              {champ(m.texte_fr, m.texte_en, locale) && (
                <p
                  className="m-0 mt-auto text-[15px] font-light leading-[1.7]"
                  style={{ color: 'var(--soft)' }}
                >
                  {champ(m.texte_fr, m.texte_en, locale)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
