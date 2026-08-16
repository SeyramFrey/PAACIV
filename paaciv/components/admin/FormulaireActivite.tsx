'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { enregistrerActivite } from '@/app/[locale]/admin/activites/actions'
import { imageUrl } from '@/lib/media'

export type ActiviteAdmin = {
  id: string
  titre_fr: string
  titre_en: string | null
  cadence_fr: string | null
  cadence_en: string | null
  description_fr: string | null
  description_en: string | null
  cta_libelle_fr: string | null
  cta_libelle_en: string | null
  cta_href: string | null
  image: string | null
  ordre: number
  statut: 'brouillon' | 'publie'
}

export function FormulaireActivite({ initial }: { initial?: Partial<ActiviteAdmin> | null }) {
  const t = useTranslations('adminActivites')
  const router = useRouter()
  const [onglet, setOnglet] = useState<'fr' | 'en'>('fr')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    const fd = new FormData(e.currentTarget)
    try {
      const resultat = await enregistrerActivite(fd)
      if (!resultat.ok) {
        setErreur(t(resultat.erreur === 'titreRequis' ? 'erreurTitreRequis' : 'erreurEnregistrement'))
        return
      }
      router.push('/admin/activites?enregistre=1')
      router.refresh()
    } catch {
      setErreur(t('erreurEnregistrement'))
    } finally {
      setEnCours(false)
    }
  }

  const valeurInitiale = (name: string) =>
    ((initial as Record<string, unknown> | undefined)?.[name] as string | undefined) ?? ''

  const champ = (name: string, label: string) => (
    <label className="flex flex-col text-sm">
      <span className="mb-1 font-semibold">{label}</span>
      <input
        name={name}
        aria-label={label}
        defaultValue={valeurInitiale(name)}
        className="rounded-xl border border-filet bg-fond px-3 py-2"
      />
    </label>
  )

  const zoneTexte = (name: string, label: string) => (
    <label className="flex flex-col text-sm">
      <span className="mb-1 font-semibold">{label}</span>
      <textarea
        name={name}
        aria-label={label}
        rows={4}
        defaultValue={valeurInitiale(name)}
        className="rounded-xl border border-filet bg-fond px-3 py-2"
      />
    </label>
  )

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" defaultValue={initial.id} />}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOnglet('fr')}
          className={onglet === 'fr' ? 'font-bold text-ocre' : 'text-doux'}
        >
          {t('ongletFr')}
        </button>
        <button
          type="button"
          onClick={() => setOnglet('en')}
          className={onglet === 'en' ? 'font-bold text-ocre' : 'text-doux'}
        >
          {t('ongletEn')}
        </button>
      </div>

      <div className={onglet === 'fr' ? 'grid gap-4' : 'hidden'}>
        {champ('titre_fr', `${t('colonneTitre')} (FR)`)}
        {champ('cadence_fr', `${t('cadence')} (FR)`)}
        {zoneTexte('description_fr', `${t('description')} (FR)`)}
        {champ('cta_libelle_fr', `${t('ctaLibelle')} (FR)`)}
      </div>
      <div className={onglet === 'en' ? 'grid gap-4' : 'hidden'}>
        {champ('titre_en', `${t('colonneTitre')} (EN)`)}
        {champ('cadence_en', `${t('cadence')} (EN)`)}
        {zoneTexte('description_en', `${t('description')} (EN)`)}
        {champ('cta_libelle_en', `${t('ctaLibelle')} (EN)`)}
      </div>

      {champ('cta_href', t('ctaHref'))}

      <div className="space-y-2">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('image')}</span>
          <input type="file" name="image" accept="image/*" aria-label={t('image')} className="text-sm" />
        </label>
        {initial?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl(initial.image)} alt="" className="h-24 w-24 rounded-xl object-cover" />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('ordre')}</span>
          <input
            name="ordre"
            type="number"
            aria-label={t('ordre')}
            defaultValue={initial?.ordre ?? 0}
            className="rounded-xl border border-filet bg-fond px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('statut')}</span>
          <select
            name="statut"
            defaultValue={initial?.statut ?? 'brouillon'}
            aria-label={t('statut')}
            className="rounded-xl border border-filet bg-fond px-3 py-2"
          >
            <option value="brouillon">{t('brouillon')}</option>
            <option value="publie">{t('publie')}</option>
          </select>
        </label>
      </div>

      {erreur && (
        <p role="alert" className="text-sm font-semibold text-ocre">
          {erreur}
        </p>
      )}

      <Button type="submit" variant="gold" disabled={enCours}>
        {t('enregistrer')}
      </Button>
    </form>
  )
}
