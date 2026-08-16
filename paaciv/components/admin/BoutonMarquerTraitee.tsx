'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { marquerDemandeTraitee } from '@/app/[locale]/admin/demandes/actions'

// Composant client plutôt que `<form action={marquerDemandeTraitee.bind(...)}>` :
// l'action renvoie désormais { ok: false } sur une session expirée (au lieu
// de lever) et il faut un endroit pour l'afficher — un simple POST fire-and-
// forget ne montrerait jamais ce résultat à l'exploitant. Même patron que
// `BoutonExporterAbonnes`.
export function BoutonMarquerTraitee({ id }: { id: string }) {
  const t = useTranslations('adminDemandes')
  const router = useRouter()
  const [enCours, demarrer] = useTransition()
  const [erreur, setErreur] = useState(false)

  function marquer() {
    setErreur(false)
    demarrer(async () => {
      const resultat = await marquerDemandeTraitee(id)
      if (!resultat.ok) {
        setErreur(true)
        return
      }
      // Rafraîchissement explicite, défensif — voir le commentaire détaillé
      // dans `FormSupprimerAction.tsx` : garantit le rendu à jour sans
      // dépendre d'un comportement de rafraîchissement automatique du Router
      // Cache non documenté pour un appel de Server Action hors `<form
      // action>`.
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button type="button" onClick={marquer} disabled={enCours} className="text-ocre underline disabled:opacity-60">
        {t('marquerTraitee')}
      </button>
      {erreur && (
        <span role="alert" className="text-xs font-semibold text-danger">
          {t('erreurAction')}
        </span>
      )}
    </div>
  )
}
