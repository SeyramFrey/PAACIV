'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { EditeurRiche } from '@/components/admin/EditeurRiche'
import { enregistrerArchitecte } from '@/app/[locale]/admin/architectes/actions'
import { imageUrl } from '@/lib/media'

// Forme brute de la ligne `architectes` telle que renvoyée par
// `select('*')` côté admin (contrairement à `ArchitecteDetail`, qui est la
// projection publique et n'expose ni `ordre` ni `statut`).
export type ArchitecteAdmin = {
  id: string
  slug: string
  nom: string
  origine: 'ivoirien' | 'etranger'
  photo: string | null
  annee_naissance: number | null
  annee_deces: number | null
  periode_texte: string | null
  bio_fr: string | null
  bio_en: string | null
  parcours_fr: string | null
  parcours_en: string | null
  realisations_texte_fr: string | null
  realisations_texte_en: string | null
  ordre: number
  statut: 'brouillon' | 'publie'
}

export function FormulaireArchitecte({
  initial,
}: {
  initial?: Partial<ArchitecteAdmin> | null
}) {
  const t = useTranslations('formArchitecte')
  const router = useRouter()
  const [onglet, setOnglet] = useState<'fr' | 'en'>('fr')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnCours(true)
    setErreur(false)
    const fd = new FormData(e.currentTarget)
    try {
      const { id } = await enregistrerArchitecte(fd)
      router.push(`/admin/architectes/${id}`)
      router.refresh()
    } catch {
      setErreur(true)
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
        defaultValue={
          (initial as Record<string, unknown> | undefined)?.[name] as string | number | undefined ?? ''
        }
        className="rounded-xl border border-encre/20 bg-white px-3 py-2"
      />
    </label>
  )

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" defaultValue={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        {champ('nom', t('nom'))}
        {champ('slug', t('slug'))}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('origine')}</span>
          <select
            name="origine"
            defaultValue={initial?.origine ?? 'ivoirien'}
            aria-label={t('origine')}
            className="rounded-xl border border-encre/20 bg-white px-3 py-2"
          >
            <option value="ivoirien">{t('ivoirien')}</option>
            <option value="etranger">{t('etranger')}</option>
          </select>
        </label>
        {champ('annee_naissance', t('anneeNaissance'), 'number')}
        {champ('annee_deces', t('anneeDeces'), 'number')}
        {champ('ordre', t('ordre'), 'number')}
      </div>

      {champ('periode_texte', t('periode'))}

      {/* Onglets FR / EN */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOnglet('fr')}
          className={onglet === 'fr' ? 'font-bold text-brun' : 'text-encre/60'}
        >
          {t('ongletFr')}
        </button>
        <button
          type="button"
          onClick={() => setOnglet('en')}
          className={onglet === 'en' ? 'font-bold text-brun' : 'text-encre/60'}
        >
          {t('ongletEn')}
        </button>
      </div>

      <div className={onglet === 'fr' ? 'grid gap-4' : 'hidden'}>
        <div className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('bio')}</span>
          <EditeurRiche name="bio_fr" defaultValue={initial?.bio_fr ?? ''} ariaLabel={t('bio')} />
        </div>
        <div className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('parcours')}</span>
          <EditeurRiche name="parcours_fr" defaultValue={initial?.parcours_fr ?? ''} ariaLabel={t('parcours')} />
        </div>
        <div className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('realisations')}</span>
          <EditeurRiche
            name="realisations_texte_fr"
            defaultValue={initial?.realisations_texte_fr ?? ''}
            ariaLabel={t('realisations')}
          />
        </div>
      </div>
      <div className={onglet === 'en' ? 'grid gap-4' : 'hidden'}>
        <div className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('bio')}</span>
          <EditeurRiche name="bio_en" defaultValue={initial?.bio_en ?? ''} ariaLabel={t('bio')} />
        </div>
        <div className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('parcours')}</span>
          <EditeurRiche name="parcours_en" defaultValue={initial?.parcours_en ?? ''} ariaLabel={t('parcours')} />
        </div>
        <div className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('realisations')}</span>
          <EditeurRiche
            name="realisations_texte_en"
            defaultValue={initial?.realisations_texte_en ?? ''}
            ariaLabel={t('realisations')}
          />
        </div>
      </div>

      {/* Photo */}
      <div className="space-y-2">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('photo')}</span>
          <input type="file" name="photo" accept="image/*" aria-label={t('photo')} className="text-sm" />
        </label>
        {initial?.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl(initial.photo)} alt="" className="h-24 w-24 rounded-xl object-cover" />
        )}
      </div>

      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('statut')}</span>
        <select
          name="statut"
          defaultValue={initial?.statut ?? 'brouillon'}
          aria-label={t('statut')}
          className="w-48 rounded-xl border border-encre/20 bg-white px-3 py-2"
        >
          <option value="brouillon">{t('brouillon')}</option>
          <option value="publie">{t('publie')}</option>
        </select>
      </label>

      {erreur && (
        <p role="alert" className="text-sm font-semibold text-brun">
          {t('erreurEnregistrement')}
        </p>
      )}

      <Button type="submit" variant="gold" disabled={enCours}>
        {t('enregistrer')}
      </Button>
    </form>
  )
}
