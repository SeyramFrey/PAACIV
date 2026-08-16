import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { champ } from '@/lib/i18n-champ'
import { texte, type Textes } from '@/lib/data/contenu-site'
import { partitionnerEvenements } from '@/lib/evenements-dates'
import type { EvenementListItem } from '@/lib/data/evenements'

// `date_debut` est une colonne `date` (« 2026-09-12 »), sans heure ni fuseau.
// `timeZone: 'UTC'` est indispensable : un fuseau local décalerait
// l'affichage d'un jour pour tout visiteur situé à l'ouest du méridien de
// Greenwich. `formatToParts`, et non `.format()`, pour composer nous-mêmes
// le séparateur « . » — `.format()` rendrait « 12/09 » en français.
function formaterDate(dateISO: string, locale: string): string {
  const parts = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).formatToParts(new Date(`${dateISO}T00:00:00Z`))
  const jour = parts.find((p) => p.type === 'day')?.value ?? ''
  const mois = parts.find((p) => p.type === 'month')?.value ?? ''
  return `${jour}.${mois}`
}

// Délais échelonnés des trois lignes de la maquette (lignes 368-383 de la
// référence de design : le premier événement y prend la grande vignette
// image plutôt qu'une ligne). Le troisième délai de la maquette (« 210 »)
// n'a pas de ligne correspondante ici : avec la vedette en carte et la
// limite de quatre événements du brief, il ne reste que trois lignes.
const DELAIS: (string | undefined)[] = [undefined, '70', '140']

export async function Agenda({ evenements, textes }: { evenements: EvenementListItem[]; textes: Textes }) {
  const locale = await getLocale()
  const t = await getTranslations('accueil')
  const surtitre = texte(textes, 'agenda_surtitre', locale)
  const titre = texte(textes, 'agenda_titre', locale)

  const { aVenir } = partitionnerEvenements(evenements, new Date())
  const prochains = aVenir.slice(0, 4)
  const [vedette, ...suite] = prochains

  return (
    <section
      id="agenda"
      className="px-[clamp(20px,5vw,80px)] py-[clamp(90px,10vw,150px)]"
      style={{ background: 'var(--deep)', color: 'var(--onDeep)' }}
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mx-auto mb-[clamp(36px,5vw,64px)] max-w-[680px] text-center">
          <p
            data-rv=""
            className="m-0 mb-3.5 text-[11px] font-medium uppercase leading-none tracking-[0.3em]"
            style={{ color: 'var(--accent)' }}
          >
            {surtitre}
          </p>
          <h2 data-rv="" data-d="60" className="m-0 font-serif text-[clamp(32px,4.2vw,64px)] leading-[1.05]">
            {titre}
          </h2>
        </div>

        {prochains.length === 0 ? (
          <p data-rv="" className="text-center text-sm opacity-70">
            {t('aucunEvenement')}
          </p>
        ) : (
          <div className="grid items-stretch gap-[clamp(20px,2.6vw,40px)] lg:grid-cols-2">
            {vedette && (
              <Link
                href={`/evenements/${vedette.slug}`}
                data-clip=""
                className="relative flex min-h-[clamp(340px,34vw,480px)] flex-col justify-end overflow-hidden rounded p-8"
                style={{ color: 'var(--onDeep)' }}
              >
                {vedette.image && (
                  <img
                    src={vedette.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ filter: 'var(--imgf)' }}
                  />
                )}
                <span
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(180deg, transparent 30%, oklch(0.1 0.02 46 / 0.88))' }}
                />
                <p className="relative m-0 font-serif text-[clamp(22px,2vw,30px)] leading-[1.2]">
                  {champ(vedette.titre_fr, vedette.titre_en, locale)}
                </p>
                <div className="relative mt-3.5 flex gap-[22px] text-[11px] font-medium uppercase leading-none tracking-[0.16em] opacity-80">
                  <span>{formaterDate(vedette.date_debut, locale)}</span>
                  {vedette.lieu && <span>{vedette.lieu}</span>}
                </div>
              </Link>
            )}

            <div className="flex flex-col gap-0.5">
              {suite.map((e, i) => (
                <Link
                  key={e.id}
                  href={`/evenements/${e.slug}`}
                  data-rv=""
                  data-d={DELAIS[i]}
                  className="flex items-center justify-between gap-5 border-b px-6 py-[26px] transition-[padding] duration-300 hover:pl-8"
                  style={{ borderColor: 'color-mix(in oklab, var(--accent) 20%, transparent)', color: 'var(--onDeep)' }}
                >
                  <span>
                    <span className="block font-serif text-xl leading-[1.3]">
                      {champ(e.titre_fr, e.titre_en, locale)}
                    </span>
                    {e.lieu && <span className="mt-1.5 block text-[13px] font-light opacity-70">{e.lieu}</span>}
                  </span>
                  <span className="flex flex-none items-center gap-[18px]">
                    <span className="text-xs font-medium tracking-[0.16em]">{formaterDate(e.date_debut, locale)}</span>
                    <span
                      className="text-[11px] font-medium uppercase leading-none tracking-[0.18em]"
                      style={{ color: 'var(--accent)' }}
                    >
                      {t('voir')}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
