'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { imageUrl } from '@/lib/media'
import { enregistrerMedia } from '@/app/[locale]/admin/medias/actions'

// Un formulaire par emplacement de `medias_site`. `onSubmit` + `preventDefault`
// + `useTransition` plutôt que `<form action={…}>` : React 19 viderait sinon
// les champs non contrôlés avant l'exécution de l'action — et ici il viderait
// aussi le champ fichier, donc le téléversement partirait à vide.
export function FormulaireMedia({
  emplacement,
  chemin,
  altFr,
  altEn,
  credit,
  licence,
  licenceUrl,
}: {
  emplacement: string
  chemin: string
  altFr: string | null
  altEn: string | null
  credit: string | null
  licence: string | null
  licenceUrl: string | null
}) {
  const t = useTranslations('adminMedias')
  const [enCours, demarrer] = useTransition()
  const [erreur, setErreur] = useState(false)
  const [enregistre, setEnregistre] = useState(false)

  function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur(false)
    setEnregistre(false)
    const fd = new FormData(e.currentTarget)
    demarrer(async () => {
      const resultat = await enregistrerMedia(fd)
      if (!resultat.ok) {
        setErreur(true)
        return
      }
      setEnregistre(true)
    })
  }

  const champ = (name: string, label: string, valeur: string | null, type = 'text') => (
    <label className="flex flex-col text-sm">
      <span className="mb-1 font-semibold">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={valeur ?? ''}
        aria-label={`${label} — ${emplacement}`}
        autoComplete="off"
        onChange={() => setEnregistre(false)}
        className="rounded-xl border border-filet bg-fond px-3 py-2"
      />
      {(valeur ?? '').startsWith('À COMPLÉTER') && (
        <span className="mt-1 text-xs font-semibold text-danger">{t('aCompleter')}</span>
      )}
    </label>
  )

  return (
    <form onSubmit={soumettre} className="grid gap-3 rounded-xl border border-filet bg-fond/60 p-4">
      <input type="hidden" name="emplacement" value={emplacement} />
      <p className="font-mono text-xs text-doux">{emplacement}</p>

      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
        {/* Vignette de l'image en place. `imageUrl` résout indifféremment un
            chemin du bucket et une URL absolue — les douze lignes seedées sont
            encore des liens Wikimedia. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl(chemin)}
          alt=""
          data-testid="apercu-media"
          className="h-28 w-40 rounded-xl border border-filet object-cover"
        />
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('remplacer')}</span>
          <input
            type="file"
            name="fichier"
            accept="image/*"
            aria-label={`${t('remplacer')} — ${emplacement}`}
            onChange={() => setEnregistre(false)}
            className="text-sm"
          />
          <span className="mt-1 text-xs text-doux">{t('remplacerAide')}</span>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {champ('alt_fr', t('altFr'), altFr)}
        {champ('alt_en', t('altEn'), altEn)}
      </div>
      <p className="text-xs text-doux">{t('altAide')}</p>

      <div className="grid gap-3 sm:grid-cols-3">
        {champ('credit', t('credit'), credit)}
        {champ('licence', t('licence'), licence)}
        {champ('licence_url', t('licenceUrl'), licenceUrl, 'url')}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="gold" disabled={enCours}>
          {t('enregistrer')}
        </Button>
        {enregistre && (
          <span role="status" className="text-xs font-semibold text-foret">
            {t('enregistre')}
          </span>
        )}
        {erreur && (
          <span role="alert" className="text-xs font-semibold text-danger">
            {t('erreurEnregistrement')}
          </span>
        )}
      </div>
    </form>
  )
}
