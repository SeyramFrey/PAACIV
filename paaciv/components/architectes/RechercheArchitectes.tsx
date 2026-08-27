'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { PastilleArchitecte } from '@/components/architectes/PastilleArchitecte'
import type { ArchitecteListItem } from '@/lib/data/architectes'

// Comparaison insensible à la casse ET aux accents : « Leon » doit trouver
// « Jean Léon », et « francois » « François ». Sans la normalisation NFD, une
// recherche tapée sans accent — le cas courant sur un clavier de téléphone —
// ne ramènerait rien sur des noms qui en portent.
function normaliser(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function RechercheArchitectes({
  ivoiriens,
  etrangers,
  libelleIvoiriens,
  libelleEtrangers,
  libelleAucun,
}: {
  ivoiriens: ArchitecteListItem[]
  etrangers: ArchitecteListItem[]
  libelleIvoiriens: string
  libelleEtrangers: string
  libelleAucun: string
}) {
  const t = useTranslations('architectes')
  const locale = useLocale()
  const [requete, setRequete] = useState('')

  const { ivoiriensFiltres, etrangersFiltres } = useMemo(() => {
    const q = normaliser(requete)
    if (q === '') return { ivoiriensFiltres: ivoiriens, etrangersFiltres: etrangers }
    const garde = (a: ArchitecteListItem) => normaliser(a.nom).includes(q)
    return { ivoiriensFiltres: ivoiriens.filter(garde), etrangersFiltres: etrangers.filter(garde) }
  }, [requete, ivoiriens, etrangers])

  const total = ivoiriensFiltres.length + etrangersFiltres.length

  const section = (libelle: string, liste: ArchitecteListItem[]) => (
    <section aria-label={libelle} className="space-y-4">
      <h2 className="font-serif text-2xl text-ocre">{libelle}</h2>
      {liste.length === 0 ? (
        <p className="text-doux">{libelleAucun}</p>
      ) : (
        // Quatre colonnes au plus, contre six auparavant : à six, un portrait
        // fait 180 px sur un écran de 1440 et redevient une vignette. La
        // photographie est le sujet de cette page, elle a besoin de place.
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {liste.map((a) => (
            <PastilleArchitecte key={a.id} a={a} locale={locale} />
          ))}
        </div>
      )}
    </section>
  )

  return (
    <div className="space-y-10">
      <label className="flex max-w-sm flex-col text-sm">
        <span className="mb-1 font-semibold text-encre-t">{t('recherche')}</span>
        <input
          type="search"
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          placeholder={t('recherchePlaceholder')}
          className="rounded-xl border border-filet bg-fond px-3 py-2 text-encre-t"
        />
      </label>

      {/* Compte annoncé aux lecteurs d'écran : sans `aria-live`, filtrer ne
          produit aucun retour perceptible pour qui ne voit pas la grille se
          réduire. */}
      <p aria-live="polite" className="text-sm text-doux">
        {requete.trim() === '' ? null : t('resultats', { n: total })}
      </p>

      {section(libelleIvoiriens, ivoiriensFiltres)}
      {section(libelleEtrangers, etrangersFiltres)}
    </div>
  )
}
