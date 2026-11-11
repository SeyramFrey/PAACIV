'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ajouterImage } from '@/app/[locale]/admin/patrimoine/actions'

// Formulaire d'ajout d'images d'une fiche patrimoine.
//
// Composant client pour une seule raison : dire ce qui s'est passé. Avant, un
// fichier refusé faisait tomber toute la page (« This page couldn't load »),
// sans un mot sur la photo en cause ; c'est ce qu'a vécu une personne de
// l'association en envoyant une photo de téléphone le 11 novembre 2026.
// L'action renvoie maintenant l'erreur attendue (fichier illisible) en valeur,
// et ce formulaire l'affiche. Une panne inattendue (stockage, réseau) reste une
// exception, rattrapée ici en message générique.
export function FormulaireAjoutImages({ patrimoineId }: { patrimoineId: string }) {
  const t = useTranslations('adminImages')
  const formulaire = useRef<HTMLFormElement>(null)
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<{ type: 'erreur' | 'ok'; texte: string } | null>(null)

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnCours(true)
    setMessage(null)
    const fd = new FormData(e.currentTarget)
    try {
      const resultat = await ajouterImage(fd)
      if (!resultat.ok) {
        setMessage({ type: 'erreur', texte: t('erreurIllisible', { fichier: resultat.fichier, n: resultat.ajoutees }) })
        return
      }
      formulaire.current?.reset()
      setMessage({ type: 'ok', texte: t('ajoutees', { n: resultat.ajoutees }) })
    } catch {
      setMessage({ type: 'erreur', texte: t('erreurEnvoi') })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form ref={formulaire} onSubmit={envoyer} className="flex flex-wrap items-end gap-3 rounded-2xl bg-fond2/50 p-4">
      <input type="hidden" name="patrimoine_id" value={patrimoineId} />
      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('ajouter')}</span>
        <input name="fichiers" aria-label={t('ajouter')} type="file" accept="image/*" multiple />
      </label>
      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('legende')}</span>
        <input name="legende_fr" className="rounded border border-filet px-2 py-1" />
      </label>
      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('credit')}</span>
        <input name="credit" className="rounded border border-filet px-2 py-1" />
      </label>
      <button
        type="submit"
        disabled={enCours}
        className="rounded-full bg-or px-4 py-2 text-sm font-semibold text-encre disabled:opacity-60"
      >
        {enCours ? t('envoiEnCours') : t('ajouter')}
      </button>
      {/* Région annoncée : le message arrive après un envoi qui peut prendre
          plusieurs secondes sur un téléphone. */}
      <p
        role="status"
        aria-live="polite"
        className={`basis-full text-sm font-semibold ${message?.type === 'erreur' ? 'text-danger' : 'text-foret'}`}
      >
        {message?.texte}
      </p>
    </form>
  )
}
