'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { enregistrerContenu } from '@/app/[locale]/admin/contenu/actions'

// Un formulaire par clé de `contenu_site`. `onSubmit` + `preventDefault` +
// useTransition plutôt que `<form action={enregistrerContenu}>` : React 19
// viderait sinon les champs non contrôlés avant même l'exécution de l'action
// (même motif que components/soutenir/FormulaireSoutien.tsx).
export function FormulaireContenuLigne({
  cle,
  valeurFr,
  valeurEn,
}: {
  cle: string
  valeurFr: string | null
  valeurEn: string | null
}) {
  const t = useTranslations('adminContenu')
  const [enCours, demarrer] = useTransition()
  const [erreur, setErreur] = useState(false)
  const [enregistre, setEnregistre] = useState(false)

  function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur(false)
    setEnregistre(false)
    const fd = new FormData(e.currentTarget)
    demarrer(async () => {
      const resultat = await enregistrerContenu(fd)
      if (!resultat.ok) {
        setErreur(true)
        return
      }
      setEnregistre(true)
    })
  }

  const aCompleterFr = (valeurFr ?? '').startsWith('À COMPLÉTER')
  const aCompleterEn = (valeurEn ?? '').startsWith('À COMPLÉTER')

  return (
    <form
      onSubmit={soumettre}
      className="grid gap-3 rounded-xl border border-encre/10 bg-white/60 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
    >
      <input type="hidden" name="cle" value={cle} />
      <p className="font-mono text-xs text-encre/50 sm:col-span-3">{cle}</p>

      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('valeurFr')}</span>
        <input
          name="valeur_fr"
          type="text"
          aria-label={`${t('valeurFr')} — ${cle}`}
          defaultValue={valeurFr ?? ''}
          className="rounded-xl border border-encre/20 bg-white px-3 py-2"
        />
        {aCompleterFr && <span className="mt-1 text-xs font-semibold text-terracotta">{t('aCompleter')}</span>}
      </label>

      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('valeurEn')}</span>
        <input
          name="valeur_en"
          type="text"
          aria-label={`${t('valeurEn')} — ${cle}`}
          defaultValue={valeurEn ?? ''}
          className="rounded-xl border border-encre/20 bg-white px-3 py-2"
        />
        {aCompleterEn && <span className="mt-1 text-xs font-semibold text-terracotta">{t('aCompleter')}</span>}
      </label>

      <div className="flex flex-col items-start gap-1">
        <Button type="submit" variant="gold" disabled={enCours}>
          {t('enregistrer')}
        </Button>
        {enregistre && (
          <span role="status" className="text-xs font-semibold text-vert">
            {t('enregistre')}
          </span>
        )}
        {erreur && (
          <span role="alert" className="text-xs font-semibold text-terracotta">
            {t('erreurEnregistrement')}
          </span>
        )}
      </div>
    </form>
  )
}
