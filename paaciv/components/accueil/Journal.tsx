'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { champ } from '@/lib/i18n-champ'
import type { ArticleListItem } from '@/lib/data/articles'

// `date_publication` est une colonne `date` (YYYY-MM-DD) : `timeZone: 'UTC'`
// évite qu'un fuseau local ne décale l'affichage d'un jour, comme partout
// ailleurs dans le projet (`app/[locale]/articles/page.tsx`, Agenda.tsx…).
function dateLocalisee(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso))
}

// Transposition des lignes 526-570 de la référence de design.
export function Journal({
  articles,
  surtitre,
  titre,
}: {
  articles: ArticleListItem[]
  surtitre: string
  titre: string
}) {
  const locale = useLocale()
  const t = useTranslations('accueil')
  const piste = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [decalage, setDecalage] = useState(0)

  useLayoutEffect(() => {
    const carte = piste.current?.children[index] as HTMLElement | undefined
    setDecalage(carte ? carte.offsetLeft : 0)
  }, [index, articles])

  // Aucun article publié : le bloc entier disparaît plutôt que d'afficher un
  // titre suivi d'un carrousel vide.
  if (articles.length === 0) return null

  const dernier = articles.length - 1

  return (
    <section
      id="journal"
      className="relative overflow-hidden px-[clamp(20px,5vw,80px)] py-[clamp(90px,10vw,150px)]"
    >
      <img
        data-par="0.08"
        src="https://commons.wikimedia.org/wiki/Special:FilePath/Cathedrale%20St%20Paul%20Abidjan%201.jpg?width=1800"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: 'var(--imgf)' }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, oklch(0.12 0.02 46 / 0.86), oklch(0.1 0.02 46 / 0.92))' }}
      />

      <div className="relative mx-auto max-w-[1240px]" style={{ color: 'oklch(0.96 0.02 84)' }}>
        <div className="mb-11 text-center">
          <p
            data-rv=""
            className="m-0 mb-3.5 text-[11px] font-medium uppercase leading-none tracking-[0.3em]"
            style={{ color: 'var(--accent)' }}
          >
            {surtitre}
          </p>
          <h2 data-rv="" data-d="60" className="m-0 font-serif text-[clamp(32px,4.2vw,64px)] leading-none">
            {titre}
          </h2>
        </div>

        <div className="relative flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            aria-label={t('precedent')}
            className="grid h-[46px] w-[46px] flex-none place-items-center rounded-full border border-[oklch(0.95_0.02_84/0.4)] text-[oklch(0.96_0.02_84)] transition-colors duration-[0.4s] hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[oklch(0.14_0.02_46)] disabled:opacity-40"
          >
            ←
          </button>

          <div className="flex-1 overflow-hidden">
            <div
              ref={piste}
              className="flex"
              style={{ transform: `translateX(-${decalage}px)`, transition: 'transform .8s cubic-bezier(.16,1,.3,1)' }}
            >
              {articles.map((a, i) => {
                const categorie = a.categorie ? champ(a.categorie.nom_fr, a.categorie.nom_en, locale) : ''
                const date = dateLocalisee(a.date_publication, locale)
                const chapo = champ(a.chapo_fr, a.chapo_en, locale)
                return (
                  <article
                    key={a.id}
                    // Diapositives hors écran retirées de l'ordre de
                    // tabulation ET de l'arbre d'accessibilité : sans `inert`,
                    // le lien « Lire » d'un article masqué reste focusable,
                    // et lui donner le focus force le navigateur à faire
                    // défiler le conteneur `overflow-hidden` qui l'englobe —
                    // un défilement que rien ne remet à zéro, désalignant le
                    // rail durablement. Même principe que le
                    // `tabIndex={estActif ? 0 : -1}` d'`Activites.tsx`.
                    inert={i !== index}
                    className="grid flex-none basis-full items-stretch"
                    style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
                  >
                    <div className="overflow-hidden" style={{ minHeight: 'clamp(260px,26vw,360px)' }}>
                      {a.image && (
                        <img
                          src={a.image}
                          alt=""
                          className="h-full w-full object-cover"
                          style={{ filter: 'var(--imgf)' }}
                        />
                      )}
                    </div>
                    <div
                      className="flex flex-col justify-center"
                      style={{ background: 'var(--bg)', color: 'var(--ink)', padding: 'clamp(28px,3.4vw,52px)' }}
                    >
                      <p
                        className="m-0 mb-3.5 text-[10px] font-medium uppercase leading-none tracking-[0.22em]"
                        style={{ color: 'var(--ocre)' }}
                      >
                        {categorie ? `${categorie} · ${date}` : date}
                      </p>
                      <h3 className="m-0 font-serif text-[clamp(24px,2.4vw,36px)] leading-[1.15]">
                        {champ(a.titre_fr, a.titre_en, locale)}
                      </h3>
                      {chapo && (
                        <p className="mt-4 text-[15px] font-light leading-[1.75]" style={{ color: 'var(--soft)' }}>
                          {chapo}
                        </p>
                      )}
                      {/* Pas de `transition-colors` ici : la maquette (ligne
                          544) ne déclare AUCUNE transition sur ce lien,
                          contrairement aux CTA voisins qui en déclarent une —
                          un choix de la maquette, pas un oubli. En ajouter
                          une serait du mouvement inventé (leçon de la
                          Task 13). */}
                      <Link
                        href={`/articles/${a.slug}`}
                        className="mt-6 self-start rounded-full border border-[var(--ink)] px-[26px] py-[13px] text-[10px] font-semibold uppercase leading-none tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bg)]"
                      >
                        {t('lire')}
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(dernier, i + 1))}
            disabled={index === dernier}
            aria-label={t('suivant')}
            className="grid h-[46px] w-[46px] flex-none place-items-center rounded-full border border-[oklch(0.95_0.02_84/0.4)] text-[oklch(0.96_0.02_84)] transition-colors duration-[0.4s] hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[oklch(0.14_0.02_46)] disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>
    </section>
  )
}
