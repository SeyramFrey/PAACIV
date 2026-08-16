'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { MiniCarte } from '@/components/carte/MiniCarte'
import { EditeurRiche } from '@/components/admin/EditeurRiche'
import { LiaisonArchitectes } from '@/components/admin/LiaisonArchitectes'
import { enregistrerPatrimoine } from '@/app/[locale]/admin/patrimoine/actions'
import type { PatrimoineDetail, Ref } from '@/lib/data/patrimoine'
import { ETATS_CONSERVATION, estEtatConservation } from '@/lib/etats-conservation'

type Options = { types: Ref[]; programmes: Ref[]; districts: Ref[]; epoques: Ref[] }
type ArchitecteOpt = { id: string; nom: string }
type LiaisonInit = { architecte_id: string; role: string | null }

export function FormulairePatrimoine({
  options,
  initial,
  locale,
  architectes,
  liaisons,
}: {
  options: Options
  initial?: Partial<PatrimoineDetail> | null
  locale: string
  architectes: ArchitecteOpt[]
  liaisons: LiaisonInit[]
}) {
  const t = useTranslations('formPatrimoine')
  const tEtat = useTranslations('etats')
  const router = useRouter()
  const [onglet, setOnglet] = useState<'fr' | 'en'>('fr')
  const [lat, setLat] = useState<number | ''>(initial?.lat ?? '')
  const [lng, setLng] = useState<number | ''>(initial?.lng ?? '')
  const [enCours, setEnCours] = useState(false)
  // `null` = pas d'erreur ; sinon le message déjà traduit à afficher dans la
  // région d'alerte. `enregistrerPatrimoine` distingue erreurs *attendues*
  // (retour `{ ok: false, erreur }`, mappé ici vers une clé i18n précise — la
  // latitude ou la longitude est hors bornes) et erreurs *inattendues*
  // (`throw`, catch générique ci-dessous) : voir le commentaire dans actions.ts
  // pour le raisonnement complet.
  const [erreur, setErreur] = useState<string | null>(null)

  const nom = (r: Ref) => (locale === 'en' ? r.nom_en || r.nom_fr : r.nom_fr)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    const fd = new FormData(e.currentTarget)
    try {
      const resultat = await enregistrerPatrimoine(fd)
      if (!resultat.ok) {
        setErreur(t(resultat.erreur === 'latitudeHorsBornes' ? 'erreurLatitudeHorsBornes' : 'erreurLongitudeHorsBornes'))
        return
      }
      router.push(`/admin/patrimoine/${resultat.id}?enregistre=1`)
      router.refresh()
    } catch {
      setErreur(t('erreurEnregistrement'))
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
        className="rounded-xl border border-filet bg-fond px-3 py-2"
      />
    </label>
  )

  const selectRef = (name: string, label: string, refs: Ref[], val?: string | null) => (
    <label className="flex flex-col text-sm">
      <span className="mb-1 font-semibold">{label}</span>
      <select name={name} defaultValue={val ?? ''} className="rounded-xl border border-filet bg-fond px-3 py-2">
        <option value="">{t('choisir')}</option>
        {refs.map((r) => (
          <option key={r.id} value={r.id}>
            {nom(r)}
          </option>
        ))}
      </select>
    </label>
  )

  // L'état de conservation n'est plus du texte libre (contrainte en base
  // depuis 0023). `defaultValue` retombe sur '' — « non renseigné » — si la
  // fiche porte encore une valeur héritée hors vocabulaire : mieux vaut un
  // champ visiblement vide, que l'éditeur/rice reclassera, qu'une option
  // fantôme sélectionnée que le `<select>` n'afficherait de toute façon pas.
  const selectEtat = () => {
    const val = initial?.etat_conservation
    return (
      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('etat')}</span>
        <select
          name="etat_conservation"
          aria-label={t('etat')}
          defaultValue={estEtatConservation(val) ? val : ''}
          className="rounded-xl border border-filet bg-fond px-3 py-2"
        >
          <option value="">{t('choisir')}</option>
          {ETATS_CONSERVATION.map((e) => (
            <option key={e} value={e}>
              {tEtat(e)}
            </option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" defaultValue={initial.id} />}

      {/* Onglets FR / EN */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setOnglet('fr')} className={onglet === 'fr' ? 'font-bold text-ocre' : 'text-doux'}>
          {t('ongletFr')}
        </button>
        <button type="button" onClick={() => setOnglet('en')} className={onglet === 'en' ? 'font-bold text-ocre' : 'text-doux'}>
          {t('ongletEn')}
        </button>
      </div>

      <div className={onglet === 'fr' ? 'grid gap-4 sm:grid-cols-2' : 'hidden'}>
        {champ('titre_fr', t('titre_fr'))}
        {champ('resume_fr', t('resume'))}
        <div className="flex flex-col text-sm sm:col-span-2">
          <span className="mb-1 font-semibold">{t('description')}</span>
          <EditeurRiche name="description_fr" defaultValue={initial?.description_fr ?? ''} ariaLabel={t('description')} />
        </div>
        {champ('style_fr', t('style'))}
        {champ('adresse_fr', t('adresse'))}
        {champ('sources_fr', t('sources'))}
      </div>
      <div className={onglet === 'en' ? 'grid gap-4 sm:grid-cols-2' : 'hidden'}>
        {champ('titre_en', t('titre_en'))}
        {champ('resume_en', t('resume'))}
        <div className="flex flex-col text-sm sm:col-span-2">
          <span className="mb-1 font-semibold">{t('description')}</span>
          <EditeurRiche name="description_en" defaultValue={initial?.description_en ?? ''} ariaLabel={t('description')} />
        </div>
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
        {selectEtat()}
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
        {/* `min`/`max` : première des trois barrières contre une coordonnée hors
            bornes (puis `validerCoordonnee` côté serveur, puis la contrainte
            CHECK de 0019). Le navigateur refuse la soumission et signale le
            champ dès la frappe, sans aller-retour. `step="any"` est
            indispensable : le pas par défaut d'un `type="number"` vaut 1, ce
            qui invaliderait toute décimale — or la carte écrit six décimales. */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            lat
            <input name="lat" aria-label="lat" type="number" min={-90} max={90} step="any" value={lat} onChange={(e) => setLat(e.target.value === '' ? '' : Number(e.target.value))} className="w-32 rounded border border-filet px-2 py-1" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            lng
            <input name="lng" aria-label="lng" type="number" min={-180} max={180} step="any" value={lng} onChange={(e) => setLng(e.target.value === '' ? '' : Number(e.target.value))} className="w-32 rounded border border-filet px-2 py-1" />
          </label>
        </div>
      </div>

      <LiaisonArchitectes architectes={architectes} initial={liaisons} label={t('architectes')} />

      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('statut')}</span>
        <select
          name="statut"
          defaultValue={initial?.statut ?? 'brouillon'}
          aria-label={t('statut')}
          className="w-48 rounded-xl border border-filet bg-fond px-3 py-2"
        >
          <option value="brouillon">{t('brouillon')}</option>
          <option value="publie">{t('publie')}</option>
        </select>
      </label>

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
