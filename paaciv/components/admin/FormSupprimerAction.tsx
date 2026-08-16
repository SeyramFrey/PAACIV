'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { BoutonSupprimer } from '@/components/admin/BoutonSupprimer'

type Resultat = { ok: true } | { ok: false; erreur: 'echec' }

// `onSubmit` + `preventDefault` + `useTransition`, PAS `<form action={fn}>` :
// deux raisons ici, pas une seule. (1) `supprimerDemande`/`supprimerAbonne`
// renvoient désormais une valeur (erreurs attendues en valeur de retour,
// jamais en exception), incompatible avec le type de la prop `action` d'un
// `<form>` (`void | Promise<void>`). (2) plus grave : un `<form
// action={async () => { await action() }}>` posé depuis un Composant Serveur
// a été tenté puis cassé À L'EXÉCUTION — « Functions cannot be passed
// directly to Client Components unless you explicitly expose it by marking
// it with "use server" » — parce qu'un nouveau closure enveloppant une
// Server Action n'est PAS lui-même une référence serveur valide, seul un
// `.bind()` direct sur l'action original l'est. `onSubmit` appelle l'action
// comme une simple fonction asynchrone depuis un Composant Client, ce qui
// est le mécanisme de base des Server Actions et n'a besoin ni de `.bind()`
// ni de `<form action>`.
export function FormSupprimerAction({
  action,
  message,
  erreurLabel,
  className,
  children,
}: {
  action: () => Promise<Resultat>
  message: string
  erreurLabel: string
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [enCours, demarrer] = useTransition()
  const [erreur, setErreur] = useState(false)

  return (
    <div className="flex flex-col items-start gap-1">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setErreur(false)
          demarrer(async () => {
            const resultat = await action()
            if (!resultat.ok) {
              setErreur(true)
              return
            }
            // Rafraîchissement explicite, défensif : `revalidatePath` posé
            // dans l'action invalide le cache serveur, mais rien ne garantit
            // qu'un appel direct (pas via `<form action>`) en redemande le
            // rendu à CE client précis. Vérifié par un test Playwright
            // (`tests/admin-accueil.spec.ts`) qui passe déjà sans cet appel
            // sur ce build de Next 16 — donc pas un correctif d'un défaut
            // reproduit, mais une garantie explicite plutôt que de dépendre
            // d'un comportement de rafraîchissement automatique non documenté.
            router.refresh()
          })
        }}
      >
        <BoutonSupprimer message={message} className={className} disabled={enCours}>
          {children}
        </BoutonSupprimer>
      </form>
      {erreur && (
        <span role="alert" className="text-xs font-semibold text-danger">
          {erreurLabel}
        </span>
      )}
    </div>
  )
}
