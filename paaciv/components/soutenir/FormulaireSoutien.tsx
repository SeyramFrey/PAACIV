'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { deposerDemande } from '@/app/[locale]/actions/soutien'
import type { TypeDemande } from '@/app/[locale]/actions/soutien'
import { renseigne } from '@/lib/data/contenu-site'

const champ =
  'w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]'
const styleChamp = { borderColor: 'var(--line)', color: 'var(--ink)' }

export function FormulaireSoutien({
  type,
  paiement,
  onSucces,
}: {
  type: TypeDemande
  // `null` : déjà filtré côté serveur (`app/[locale]/layout.tsx`) avant de
  // franchir la frontière client — jamais la chaîne brute « À COMPLÉTER ».
  paiement: string | null
  onSucces?: () => void
}) {
  const t = useTranslations('soutien')
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoye, setEnvoye] = useState(false)
  const [enCours, demarrer] = useTransition()

  if (envoye) {
    return (
      // `role="status"` : sans région live, un donateur non-voyant n'a aucun
      // retour au moment de l'envoi — le formulaire (et son bouton) disparaît
      // du DOM, le focus tombe au `body`. Même geste que
      // `components/accueil/Newsletter.tsx`.
      <div className="space-y-4" role="status">
        <p style={{ color: 'var(--ink)' }}>{t('merci')}</p>
        {/* Écran de confirmation agnostique au type (adhésion, don, archive :
            les trois passent par ce même composant) : sans cette garde,
            n'importe lequel des trois afficherait à un visiteur réel le
            marqueur brut « À COMPLÉTER — coordonnées bancaires… » tant que
            l'association n'a pas renseigné `soutien_paiement`. Le bloc
            entier disparaît plutôt que de laisser un titre « Pour
            finaliser : » orphelin. `paiement` arrive déjà filtré (`null` ou
            une valeur exploitable) depuis `app/[locale]/layout.tsx` — le
            second niveau de garde (`renseigne`) reste posé ici en défense en
            profondeur, pour ce composant appelable indépendamment. */}
        {paiement !== null && renseigne(paiement) && (
          <>
            <p className="text-sm" style={{ color: 'var(--soft)' }}>
              {t('paiement')}
            </p>
            <p className="whitespace-pre-line text-sm" style={{ color: 'var(--ink)' }}>
              {paiement}
            </p>
          </>
        )}
      </div>
    )
  }

  function soumettre(formData: FormData) {
    setErreur(null)
    demarrer(async () => {
      formData.set('type', type)
      const r = await deposerDemande(formData)
      if (r.ok) {
        setEnvoye(true)
        onSucces?.()
        return
      }
      // Les clés d'erreur de l'action correspondent aux clés de traduction
      // préfixées : erreur → erreurEmailInvalide, etc.
      const cle = `erreur${r.erreur.charAt(0).toUpperCase()}${r.erreur.slice(1)}`
      setErreur(t(cle))
    })
  }

  return (
    // onSubmit plutôt que `action={soumettre}` : React 19 réinitialise
    // inconditionnellement un formulaire soumis via `action` dès que celle-ci
    // est synchrone (elle ne reporte le reset que si l'action retourne un
    // thenable). `soumettre` déclenche `demarrer(...)` et retourne aussitôt
    // `undefined`, donc le formulaire se viderait au clic — avant même que
    // l'erreur serveur ne s'affiche. `onSubmit` + `preventDefault` laisse la
    // saisie intacte, y compris après une erreur.
    <form
      onSubmit={(e) => {
        e.preventDefault()
        soumettre(new FormData(e.currentTarget))
      }}
      className="space-y-4"
    >
      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--soft)' }}>
          {t('nom')}
        </span>
        <input name="nom" required className={champ} style={styleChamp} />
      </label>

      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--soft)' }}>
          {t('email')}
        </span>
        <input name="email" type="email" required className={champ} style={styleChamp} />
      </label>

      {type !== 'don' && (
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--soft)' }}>
            {t('telephone')}
          </span>
          <input name="telephone" type="tel" className={champ} style={styleChamp} />
        </label>
      )}

      {type === 'don' && (
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--soft)' }}>
            {t('montant')}
          </span>
          <input name="montant" inputMode="decimal" className={champ} style={styleChamp} />
        </label>
      )}

      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--soft)' }}>
          {type === 'archive' ? t('messageArchive') : t('message')}
        </span>
        <textarea name="message" rows={4} className={champ} style={styleChamp} />
      </label>

      {erreur && (
        <p role="alert" className="text-sm" style={{ color: 'var(--terra)' }}>
          {erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={enCours}
        className="rounded-full px-6 py-3 text-sm font-semibold transition disabled:opacity-60"
        style={{ background: 'var(--accent)', color: 'oklch(0.15 0.012 45)' }}
      >
        {enCours ? t('envoi') : t('envoyer')}
      </button>
    </form>
  )
}
