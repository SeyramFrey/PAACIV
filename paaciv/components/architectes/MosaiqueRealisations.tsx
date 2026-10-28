'use client'

import { useId, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CarteRealisation } from '@/components/architectes/CarteRealisation'
import { champ } from '@/lib/i18n-champ'
import type { RealisationLiee } from '@/lib/data/architectes'
import type { Ref } from '@/lib/data/patrimoine'

// Les réalisations d'un architecte en mosaïque, sous une bande « Type de
// programmes » qui se déplie sur la liste des programmes et filtre la grille.
//
// La bande remplace l'ancienne section « Programmes à son actif » (demande du
// client) : la liste des programmes n'est plus une déclaration à part, elle se
// lit sur les œuvres elles-mêmes — chaque patrimoine porte son type de
// programme, et le compte affiché en regard dit combien d'œuvres il couvre.
//
// Tous les programmes du référentiel sont listés, même ceux sans œuvre : c'est
// ce que le client a demandé (« quand on clique ça nous sort tout le reste »).
// Ceux qui sont vides restent visibles mais ne se sélectionnent pas — choisir
// un filtre qui vide la grille n'apprend rien au visiteur.
//
// Filtrage côté navigateur : la fiche sert déjà toutes ses réalisations, et
// elles se comptent en dizaines au plus.
export function MosaiqueRealisations({
  realisations,
  programmes,
  locale,
}: {
  realisations: RealisationLiee[]
  programmes: Ref[]
  locale: string
}) {
  const t = useTranslations('ficheArchitecte')
  const [ouvert, setOuvert] = useState(false)
  const [choix, setChoix] = useState<string | null>(null)
  const idPanneau = useId()

  const compte = useMemo(() => {
    const c = new Map<string, number>()
    for (const r of realisations) {
      if (r.programme_id) c.set(r.programme_id, (c.get(r.programme_id) ?? 0) + 1)
    }
    return c
  }, [realisations])

  const visibles = choix ? realisations.filter((r) => r.programme_id === choix) : realisations
  const programmeChoisi = programmes.find((p) => p.id === choix)

  const choisir = (id: string | null) => {
    setChoix(id)
    setOuvert(false)
  }

  return (
    <div data-rv="">
      {programmes.length > 0 && (
        <div className="mb-[clamp(24px,3vw,40px)] border-y" style={{ borderColor: 'var(--line)' }}>
          <button
            type="button"
            aria-expanded={ouvert}
            aria-controls={idPanneau}
            onClick={() => setOuvert((o) => !o)}
            className="flex w-full items-center gap-4 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {/* Libellé et choix courant empilés sur téléphone : côte à côte,
                le choix y était tronqué dès « Tous les prog… ». */}
            <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: 'var(--soft)' }}
              >
                {t('typeProgrammes')}
              </span>
              <span className="min-w-0 truncate font-serif text-[17px]" style={{ color: 'var(--ink)' }}>
                {programmeChoisi
                  ? champ(programmeChoisi.nom_fr, programmeChoisi.nom_en, locale)
                  : t('tousProgrammes')}
              </span>
            </span>
            {/* Chevron dessiné, comme celui du relevé détaillé : il pivote à
                l'ouverture et dit l'état sans mot de plus. */}
            <span
              aria-hidden="true"
              className={`inline-block transition-transform duration-300 ${ouvert ? 'rotate-90' : ''}`}
              style={{ color: 'var(--terra)' }}
            >
              ▸
            </span>
          </button>

          <div id={idPanneau} hidden={!ouvert} className="pb-5">
            <ul className="m-0 grid list-none grid-cols-1 gap-x-[34px] p-0 sm:grid-cols-2 lg:grid-cols-3">
              <li>
                <OptionProgramme
                  libelle={t('tousProgrammes')}
                  nombre={realisations.length}
                  actif={choix === null}
                  onClick={() => choisir(null)}
                />
              </li>
              {programmes.map((p) => {
                const n = compte.get(p.id) ?? 0
                return (
                  <li key={p.id}>
                    <OptionProgramme
                      libelle={champ(p.nom_fr, p.nom_en, locale)}
                      nombre={n}
                      actif={choix === p.id}
                      desactive={n === 0}
                      onClick={() => choisir(p.id)}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Compte annoncé aux lecteurs d'écran, comme sur la recherche
          d'architectes : sans lui, filtrer ne produit aucun retour pour qui ne
          voit pas la grille changer. */}
      <p aria-live="polite" className="sr-only">
        {choix ? t('nbProjets', { n: visibles.length }) : ''}
      </p>

      {visibles.length > 0 ? (
        // Mêmes colonnes que la grille de portraits de /architectes.
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {visibles.map((r) => (
            <CarteRealisation key={r.slug} realisation={r} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: 'var(--soft)' }}>
          {t('aucunDansProgramme')}
        </p>
      )}
    </div>
  )
}

function OptionProgramme({
  libelle,
  nombre,
  actif,
  desactive = false,
  onClick,
}: {
  libelle: string
  nombre: number
  actif: boolean
  desactive?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desactive}
      aria-pressed={actif}
      className="flex w-full items-baseline gap-3 border-b py-[9px] text-left text-[15px] leading-[1.4] transition-colors enabled:hover:text-terra disabled:cursor-default disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      style={{ borderColor: 'var(--line)', color: actif ? 'var(--terra)' : 'var(--ink)' }}
    >
      {/* La coche marque le filtre en cours ; masquée aux lecteurs d'écran,
          qui ont déjà `aria-pressed`. */}
      <span aria-hidden="true" className="w-3" style={{ color: 'var(--accent)' }}>
        {actif ? '✓' : ''}
      </span>
      <span className="flex-1">{libelle}</span>
      <span className="text-[12px] tabular-nums" style={{ color: 'var(--soft)' }}>
        {nombre}
      </span>
    </button>
  )
}
