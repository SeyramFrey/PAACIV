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
  // Contrôlés, pas `defaultValue` : Chrome et Firefox restaurent la valeur
  // d'un `<textarea>` non contrôlé au retour arrière, et cette restauration a
  // lieu AVANT l'hydratation React — le contenu SSR et la valeur restaurée
  // par le navigateur se retrouvent concaténés au lieu de l'un remplaçant
  // l'autre (défaut documenté par `tests/admin-accueil.spec.ts`, qui exerce
  // le même formulaire sur une navigation fraîche). Un champ contrôlé retire
  // toute ambiguïté sur la source de vérité : React est seul maître de la
  // valeur dès le premier rendu, il n'y a plus rien à « restaurer ».
  const [texteFr, setTexteFr] = useState(valeurFr ?? '')
  const [texteEn, setTexteEn] = useState(valeurEn ?? '')

  // Resynchronisation sur la valeur serveur, à la place de la clé de
  // remontage que portait `admin/contenu/page.tsx`. Cette clé-là était
  // dérivée de la valeur : après un enregistrement réussi, la revalidation
  // renvoyait la valeur qui venait d'être écrite, la clé changeait, et
  // `enregistre` disparaissait avec l'instance démontée — le témoin
  // « Enregistré. » n'était donc jamais visible.
  // Ajustement d'état pendant le rendu, le patron documenté par React pour
  // « un état dérivé d'une prop qui change » : React relance le rendu
  // immédiatement, sans repeindre l'écran intermédiaire ni monter d'effet.
  const [valeursServeur, setValeursServeur] = useState({ fr: valeurFr, en: valeurEn })
  if (valeurFr !== valeursServeur.fr || valeurEn !== valeursServeur.en) {
    setValeursServeur({ fr: valeurFr, en: valeurEn })
    setTexteFr(valeurFr ?? '')
    setTexteEn(valeurEn ?? '')
  }

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
        {/* textarea, pas input : un <input type="text"> supprime les retours
            à la ligne à la saisie. `soutien_paiement` (coordonnées bancaires,
            Wave, Orange Money) et `soutien_adhesion_avantages` (liste) sont
            rendues côté public avec `whitespace-pre-line` — elles ont
            explicitement besoin de plusieurs lignes. */}
        <textarea
          name="valeur_fr"
          rows={2}
          aria-label={`${t('valeurFr')} — ${cle}`}
          value={texteFr}
          // Le témoin s'efface dès que l'admin retouche le champ : sans le
          // remontage d'autrefois, « Enregistré. » resterait affiché au-dessus
          // d'une saisie non enregistrée.
          onChange={(e) => {
            setTexteFr(e.target.value)
            setEnregistre(false)
          }}
          autoComplete="off"
          className="rounded-xl border border-encre/20 bg-white px-3 py-2"
        />
        {aCompleterFr && <span className="mt-1 text-xs font-semibold text-terracotta">{t('aCompleter')}</span>}
      </label>

      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('valeurEn')}</span>
        <textarea
          name="valeur_en"
          rows={2}
          aria-label={`${t('valeurEn')} — ${cle}`}
          value={texteEn}
          onChange={(e) => {
            setTexteEn(e.target.value)
            setEnregistre(false)
          }}
          autoComplete="off"
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
