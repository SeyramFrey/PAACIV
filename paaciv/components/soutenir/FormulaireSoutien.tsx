'use client'

import { useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { deposerDemande } from '@/app/[locale]/actions/soutien'
import type { TypeDemande } from '@/app/[locale]/actions/soutien'

const champ =
  'w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]'
const styleChamp = { borderColor: 'var(--line)', color: 'var(--ink)' }

export function FormulaireSoutien({
  type,
  paiement,
  onSucces,
}: {
  type: TypeDemande
  paiement: string
  onSucces?: () => void
}) {
  const t = useTranslations('soutien')
  const locale = useLocale()
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoye, setEnvoye] = useState(false)
  const [enCours, demarrer] = useTransition()

  if (envoye) {
    return (
      <div className="space-y-4">
        <p style={{ color: 'var(--ink)' }}>{t('merci')}</p>
        <p className="text-sm" style={{ color: 'var(--soft)' }}>
          {t('paiement')}
        </p>
        <p className="whitespace-pre-line text-sm" style={{ color: 'var(--ink)' }}>
          {paiement}
        </p>
      </div>
    )
  }

  function soumettre(formData: FormData) {
    setErreur(null)
    demarrer(async () => {
      formData.set('type', type)
      formData.set('langue', locale)
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
    // noValidate : ce formulaire délègue la validation au serveur
    // (`deposerDemande`), qui renvoie une clé d'erreur précise affichée en
    // `role="alert"`. Sans cet attribut, la validation native du navigateur
    // (ex. `type="email"` + `required`) intercepterait la soumission avant
    // que l'action ne soit jamais appelée, et ces messages ne s'afficheraient
    // jamais.
    <form action={soumettre} noValidate className="space-y-4">
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
