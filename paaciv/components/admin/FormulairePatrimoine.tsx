'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { MiniCarte } from '@/components/carte/MiniCarte'
import { enregistrerPatrimoine } from '@/app/[locale]/admin/patrimoine/actions'
import type { PatrimoineDetail, Ref } from '@/lib/data/patrimoine'

type Options = { types: Ref[]; programmes: Ref[]; districts: Ref[]; epoques: Ref[] }

export function FormulairePatrimoine({
  options,
  initial,
  locale,
}: {
  options: Options
  initial?: Partial<PatrimoineDetail> | null
  locale: string
}) {
  const t = useTranslations('formPatrimoine')
  const router = useRouter()
  const [onglet, setOnglet] = useState<'fr' | 'en'>('fr')
  const [lat, setLat] = useState<number | ''>(initial?.lat ?? '')
  const [lng, setLng] = useState<number | ''>(initial?.lng ?? '')
  const [enCours, setEnCours] = useState(false)

  const nom = (r: Ref) => (locale === 'en' ? r.nom_en || r.nom_fr : r.nom_fr)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnCours(true)
    const fd = new FormData(e.currentTarget)
    try {
      const { id } = await enregistrerPatrimoine(fd)
      router.push(`/admin/patrimoine/${id}`)
      router.refresh()
    } finally {
      setEnCours(false)
    }
  }

  const champ = (name: string, label: string, type = 'text', ariaLabel?: string) => (
    <label className="flex flex-col text-sm">
      <span className="mb-1 font-semibold">{label}</span>
      <input
        name={name}
        type={type}
        aria-label={ariaLabel}
        defaultValue={(initial as Record<string, unknown> | undefined)?.[name] as string | undefined ?? ''}
        className="rounded-xl border border-encre/20 bg-white px-3 py-2"
      />
    </label>
  )

  const selectRef = (name: string, label: string, refs: Ref[], val?: string | null) => (
    <label className="flex flex-col text-sm">
      <span className="mb-1 font-semibold">{label}</span>
      <select name={name} defaultValue={val ?? ''} className="rounded-xl border border-encre/20 bg-white px-3 py-2">
        <option value="">{t('choisir')}</option>
        {refs.map((r) => (
          <option key={r.id} value={r.id}>
            {nom(r)}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" defaultValue={initial.id} />}

      {/* Onglets FR / EN */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setOnglet('fr')} className={onglet === 'fr' ? 'font-bold text-brun' : 'text-encre/60'}>
          {t('ongletFr')}
        </button>
        <button type="button" onClick={() => setOnglet('en')} className={onglet === 'en' ? 'font-bold text-brun' : 'text-encre/60'}>
          {t('ongletEn')}
        </button>
      </div>

      <div className={onglet === 'fr' ? 'grid gap-4 sm:grid-cols-2' : 'hidden'}>
        {champ('titre_fr', t('titre_fr'))}
        {champ('resume_fr', t('resume'))}
        {champ('description_fr', t('description'))}
        {champ('style_fr', t('style'))}
        {champ('adresse_fr', t('adresse'))}
        {champ('sources_fr', t('sources'))}
      </div>
      <div className={onglet === 'en' ? 'grid gap-4 sm:grid-cols-2' : 'hidden'}>
        {champ('titre_en', t('titre_en'))}
        {champ('resume_en', t('resume'))}
        {champ('description_en', t('description'))}
        {champ('style_en', t('style'))}
        {champ('adresse_en', t('adresse'))}
        {champ('sources_en', t('sources'))}
      </div>

      {/* Classement */}
      <div className="grid gap-4 sm:grid-cols-4">
        {selectRef('type_id', t('type'), options.types, initial?.type_id)}
        {selectRef('programme_id', t('programme'), options.programmes, initial?.programme_id)}
        {selectRef('district_id', t('district'), options.districts, initial?.district_id)}
        {selectRef('epoque_id', t('epoque'), options.epoques, initial?.epoque_id)}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {champ('date_texte', t('dateTexte'))}
        {champ('annee_debut', t('anneeDebut'), 'number')}
        {champ('annee_fin', t('anneeFin'), 'number')}
        {champ('ville', t('ville'))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {champ('statut_patrimonial', t('statutPatrimonial'), 'text', t('statutPatrimonialAria'))}
        {champ('etat_conservation', t('etat'))}
        {champ('video_url', t('video'))}
      </div>

      {/* Localisation : carte cliquable + champs lat/lng liés */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">{t('point')}</p>
        <MiniCarte
          lat={typeof lat === 'number' ? lat : 7.5}
          lng={typeof lng === 'number' ? lng : -5.5}
          onChoisir={(la, ln) => {
            setLat(Number(la.toFixed(6)))
            setLng(Number(ln.toFixed(6)))
          }}
        />
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            lat
            <input name="lat" aria-label="lat" value={lat} onChange={(e) => setLat(e.target.value === '' ? '' : Number(e.target.value))} className="w-32 rounded border border-encre/20 px-2 py-1" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            lng
            <input name="lng" aria-label="lng" value={lng} onChange={(e) => setLng(e.target.value === '' ? '' : Number(e.target.value))} className="w-32 rounded border border-encre/20 px-2 py-1" />
          </label>
        </div>
      </div>

      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('statut')}</span>
        <select
          name="statut"
          defaultValue={(initial as { statut?: string } | undefined)?.statut ?? 'brouillon'}
          aria-label={t('statut')}
          className="w-48 rounded-xl border border-encre/20 bg-white px-3 py-2"
        >
          <option value="brouillon">{t('brouillon')}</option>
          <option value="publie">{t('publie')}</option>
        </select>
      </label>

      <Button type="submit" variant="gold" disabled={enCours}>
        {t('enregistrer')}
      </Button>
    </form>
  )
}
