import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { CarteCoteIvoire } from '@/components/accueil/CarteCoteIvoire'
import { champ } from '@/lib/i18n-champ'
import type { StatistiquesTerritoire } from '@/lib/data/accueil'

// Bloc « territoire ».
//
// Composant SERVEUR, sans une ligne de JavaScript envoyée au navigateur — là
// où la version précédente montait MapLibre (785 Ko de WebGL), derrière un
// observateur d'intersection et un `next/dynamic`, pour afficher un carré.
// Tout ce fragile échafaudage disparaît avec lui : plus de garde de
// visibilité, plus de chargement paresseux, plus d'état « prête », plus
// d'écouteur d'erreur sur le style MapLibre. La carte interactive, elle, n'a
// pas bougé : elle est sur /carte, où elle a un sens.
export async function ApercuCarte({
  stats,
  surtitre,
  titre,
  texte,
  locale,
}: {
  stats: StatistiquesTerritoire
  surtitre: string
  titre: string
  texte: string
  locale: string
}) {
  const t = await getTranslations('accueil')

  const chiffres = [
    { valeur: stats.edifices, libelle: t('statEdifices') },
    { valeur: stats.communes, libelle: t('statCommunes') },
    { valeur: stats.districts, libelle: t('statDistricts') },
  ]

  // Part de chaque type, rapportée au type le plus représenté : c'est ce qui
  // donne à la barre une longueur comparable d'une ligne à l'autre. Rapportée
  // au TOTAL, avec sept types et sept fiches, toutes les barres seraient des
  // moignons indistincts.
  const maxType = Math.max(1, ...stats.parType.map((x) => x.nombre))

  return (
    <section
      className="px-[clamp(20px,5vw,80px)] py-20 lg:py-32"
      style={{ background: 'var(--deep)', color: 'var(--onDeep)' }}
    >
      <div className="mx-auto max-w-3xl text-center">
        <p data-rv="" className="text-[10px] uppercase tracking-[0.24em] opacity-60">{surtitre}</p>
        <h2 data-rv="" data-d="60" className="mt-3 font-serif text-4xl lg:text-6xl">{titre}</h2>
        <p data-rv="" data-d="120" className="mt-5 opacity-75">{texte}</p>
      </div>

      <div className="mx-auto mt-14 grid max-w-[1180px] items-center gap-[clamp(32px,5vw,72px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)]">
        <div data-rv="" data-d="180" className="mx-auto w-[min(520px,100%)]">
          <CarteCoteIvoire points={stats.points} legende={t('legendeCarte')} />
        </div>

        <div data-rv="" data-d="240" className="flex flex-col gap-9">
          <dl className="grid grid-cols-3 gap-4">
            {chiffres.map((c) => (
              // `flex-col-reverse` : le DOM porte `<dt>` avant `<dd>`, l'œil
              // lit le nombre avant son intitulé. Même patron que `Compteurs`.
              <div key={c.libelle} className="flex flex-col-reverse gap-1">
                <dt className="text-[10px] uppercase leading-tight tracking-[0.18em] opacity-60">
                  {c.libelle}
                </dt>
                <dd className="font-serif text-[clamp(34px,4.4vw,54px)] leading-none">{c.valeur}</dd>
              </div>
            ))}
          </dl>

          {stats.parType.length > 0 && (
            <div>
              <p className="mb-4 text-[10px] uppercase tracking-[0.2em] opacity-60">
                {t('repartitionTypes')}
              </p>
              <ul className="flex flex-col gap-2.5">
                {stats.parType.map((ty) => (
                  // Trois colonnes : intitulé, PISTE de largeur fixe, compte.
                  // Une barre posée sous l'intitulé et calculée en pourcentage
                  // de la colonne entière se lisait comme un soulignement de
                  // texte, pas comme une donnée — c'est la piste, constante
                  // d'une ligne à l'autre, qui rend les longueurs comparables.
                  <li
                    key={ty.nom_fr}
                    className="grid grid-cols-[minmax(0,max-content)_minmax(56px,1fr)_2ch] items-center gap-3"
                  >
                    <span className="truncate text-sm">{champ(ty.nom_fr, ty.nom_en, locale)}</span>
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-full overflow-hidden rounded-full"
                      style={{ background: 'color-mix(in oklab, var(--onDeep) 14%, transparent)' }}
                    >
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${(ty.nombre / maxType) * 100}%`,
                          background: ty.couleur ?? 'var(--terra)',
                        }}
                      />
                    </span>
                    <span className="text-right font-serif text-base tabular-nums opacity-80">
                      {ty.nombre}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stats.points.length > 0 && (
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm opacity-70">
              {stats.points.map((p) => (
                <li key={p.ville}>
                  {p.ville} <span className="opacity-60">· {t('compteEdifices', { n: p.nombre })}</span>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/carte"
            className="self-start rounded-full px-8 py-4 text-sm font-semibold transition hover:-translate-y-0.5"
            style={{ background: 'var(--accent)', color: 'oklch(0.15 0.012 45)' }}
          >
            {t('ouvrirCarte')}
          </Link>
        </div>
      </div>
    </section>
  )
}
