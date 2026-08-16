'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { champ } from '@/lib/i18n-champ'
import type { VignetteArchive } from '@/lib/data/accueil'
import type { Ref } from '@/lib/data/patrimoine'

// Transposition des lignes 400-473 de la référence de design, EN REMPLAÇANT
// la mosaïque éclatée (colonnes 2/3/4, hauteurs et décalages verticaux
// individuels) par une grille régulière (spec §3.4) : avec de vraies photos
// aux proportions variables, la mosaïque d'origine se serait déformée de
// façon imprévisible. La régularité est compensée par la cascade au scroll
// (délai croissant) et le survol qui soulève chaque vignette.
export function GrilleArchive({
  vignettes,
  types,
  total,
  surtitre,
  titre,
}: {
  vignettes: VignetteArchive[]
  types: Ref[]
  total: number
  surtitre: string
  titre: string
}) {
  const locale = useLocale()
  const t = useTranslations('accueil')
  // `null` = « Tout ». Une chaîne = l'id du type actif.
  const [filtre, setFiltre] = useState<string | null>(null)

  // Aucune vignette (aucune fiche publiée avec image) : le bloc entier
  // disparaît plutôt que d'afficher un titre, un unique filtre « Tout » et
  // les trois pastilles décoratives flottant au-dessus d'une grille vide —
  // même garde que partout ailleurs dans l'accueil (Activites,
  // PourquoiNousSuivre, CinqRaisons, Journal, Temoignages).
  if (vignettes.length === 0) return null

  // Filtres par types réellement représentés dans les vignettes chargées
  // (spec §3.4), pas les quatre catégories inventées de la maquette : un
  // filtre qui ne renverrait jamais rien serait un piège pour l'utilisateur.
  const presents = new Set(
    vignettes.map((v) => v.type_id).filter((id): id is string => id !== null),
  )
  const typesPresents = types.filter((ty) => presents.has(ty.id))

  const visibles = filtre === null ? vignettes : vignettes.filter((v) => v.type_id === filtre)

  return (
    <section
      id="archive"
      className="px-[clamp(20px,5vw,80px)] py-[clamp(70px,8vw,130px)] pb-[clamp(60px,7vw,110px)]"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="text-center">
          <p
            data-rv=""
            className="m-0 font-serif text-[clamp(26px,3vw,40px)] italic leading-none"
            style={{ color: 'var(--terra)' }}
          >
            {surtitre}
          </p>
          <h2
            data-rv=""
            data-d="60"
            className="m-0 mt-2.5 font-serif text-[clamp(32px,4.6vw,72px)] uppercase leading-none tracking-[0.01em]"
            style={{ color: 'var(--ink)' }}
          >
            {titre}
          </h2>
          <div data-rv="" data-d="120" className="mt-9 flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              onClick={() => setFiltre(null)}
              className={
                filtre === null
                  ? 'rounded-full border border-[var(--terra)] bg-[var(--terra)] px-[22px] py-3 text-[10px] font-semibold uppercase leading-none tracking-[0.18em] text-[oklch(0.98_0.01_84)] transition-colors duration-[0.4s]'
                  : 'rounded-full border border-[var(--line)] bg-transparent px-[22px] py-3 text-[10px] font-semibold uppercase leading-none tracking-[0.18em] text-[var(--ink)] transition-colors duration-[0.4s] hover:border-[var(--terra)]'
              }
              aria-pressed={filtre === null}
            >
              {t('tous')}
            </button>
            {typesPresents.map((ty) => (
              <button
                key={ty.id}
                type="button"
                onClick={() => setFiltre(ty.id)}
                className={
                  filtre === ty.id
                    ? 'rounded-full border border-[var(--terra)] bg-[var(--terra)] px-[22px] py-3 text-[10px] font-semibold uppercase leading-none tracking-[0.18em] text-[oklch(0.98_0.01_84)] transition-colors duration-[0.4s]'
                    : 'rounded-full border border-[var(--line)] bg-transparent px-[22px] py-3 text-[10px] font-semibold uppercase leading-none tracking-[0.18em] text-[var(--ink)] transition-colors duration-[0.4s] hover:border-[var(--terra)]'
                }
                aria-pressed={filtre === ty.id}
              >
                {champ(ty.nom_fr, ty.nom_en, locale)}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-[clamp(40px,5vw,72px)]">
          {/* Pastilles décoratives flottantes (lignes 409-411 de la
              référence) : `data-floaty=""` est indispensable, pas seulement
              le nom d'animation dans `style` — la règle `[data-floaty] {
              animation: none !important }` de globals.css cible l'attribut
              sous `prefers-reduced-motion`. */}
          <span
            aria-hidden="true"
            data-floaty=""
            className="absolute left-[2%] top-[18%] h-11 w-11 rounded-full"
            style={{ background: 'var(--terra)', animation: 'floaty 5s ease-in-out infinite' }}
          />
          <span
            aria-hidden="true"
            data-floaty=""
            className="absolute bottom-[16%] right-[8%] h-[26px] w-[26px] rounded-full"
            style={{ background: 'var(--accent)', animation: 'floaty 6.5s .6s ease-in-out infinite' }}
          />
          <span
            aria-hidden="true"
            data-floaty=""
            className="absolute bottom-[8%] right-[14%] h-3 w-3 rounded-full"
            style={{ background: 'var(--terra)', animation: 'floaty 4.4s 1.2s ease-in-out infinite' }}
          />

          {/* `data-rv` sur le CONTENEUR, monté en permanence, et non plus sur
              chaque `<Link>` : celles-ci sont démontées/remontées à chaque
              filtrage (`visibles` recalculé), et `Revelations` ne scanne le
              DOM qu'une fois par changement de route puis fait `unobserve`
              sur ce qu'il a révélé — un noeud recréé après un aller-retour de
              filtre ne serait plus jamais observé et resterait `opacity:0`
              pour toujours (`globals.css:86-93`). Le prix : les vignettes ne
              cascadent plus individuellement à l'entrée dans le viewport,
              seul le bloc entier se révèle — c'est le compromis correct,
              une animation perdue valant mieux qu'un contenu invisible. */}
          <div
            data-rv=""
            data-d="180"
            className="grid grid-cols-1 items-start gap-[clamp(10px,1.4vw,20px)] sm:grid-cols-2 lg:grid-cols-4"
          >
            {visibles.map((v) => (
              <Link key={v.slug} href={`/patrimoine/${v.slug}`}>
                <figure className="m-0">
                  <div
                    className="aspect-[4/3] overflow-hidden rounded-[4px] transition-[translate,filter] duration-[0.6s] ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-2"
                  >
                    <img
                      src={v.image}
                      alt=""
                      className="h-full w-full object-cover"
                      style={{ filter: 'var(--imgf)' }}
                    />
                  </div>
                  {/* Titre et ville dans deux `<span>` distincts, pas
                      concaténés en un seul noeud texte : ça garde le titre
                      seul repérable par un `getByText` exact (chaque `<span>`
                      porte alors son propre `textContent`), sans changer le
                      nom accessible du lien englobant. */}
                  <figcaption
                    className="mt-2.5 text-[11px] font-normal leading-[1.4]"
                    style={{ color: 'var(--soft)' }}
                  >
                    <span>{champ(v.titre_fr, v.titre_en, locale)}</span>
                    {v.ville && <span> · {v.ville}</span>}
                  </figcaption>
                </figure>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-[clamp(60px,7vw,100px)] flex justify-center">
          <Link
            href="/archives"
            data-rv=""
            className="rounded-full border border-[var(--ink)] px-10 py-[17px] text-[11px] font-semibold uppercase leading-none tracking-[0.2em] text-[var(--ink)] transition-colors duration-[0.4s] hover:bg-[var(--ink)] hover:text-[var(--bg)]"
          >
            {t('toutArchive', { n: total })}
          </Link>
        </div>
      </div>
    </section>
  )
}
