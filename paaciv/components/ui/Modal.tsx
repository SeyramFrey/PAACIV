'use client'

import { useEffect, useId, useRef } from 'react'
import { useTranslations } from 'next-intl'

type Props = {
  ouvert: boolean
  onFermer: () => void
  titre: string
  children: React.ReactNode
}

// `<dialog>` natif plutôt qu'un div sur-mesure : le navigateur fournit
// gratuitement le piégeage du focus, la restitution du focus au déclencheur,
// la fermeture par Échap et l'inertie du reste de la page.
export function Modal({ ouvert, onFermer, titre, children }: Props) {
  const t = useTranslations('modal')
  const ref = useRef<HTMLDialogElement>(null)
  const idTitre = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (ouvert && !d.open) d.showModal()
    if (!ouvert && d.open) d.close()
  }, [ouvert])

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitre}
      onCancel={(e) => {
        // Échap : on laisse React piloter l'état plutôt que le DOM, sinon
        // `ouvert` resterait à true et la modale ne pourrait plus se rouvrir.
        e.preventDefault()
        onFermer()
      }}
      onClick={(e) => {
        // Le backdrop fait partie du <dialog> lui-même : un clic dont la
        // cible est le dialog (et non un enfant) est un clic hors contenu.
        if (e.target === ref.current) onFermer()
      }}
      className="m-auto w-[min(560px,92vw)] rounded-lg border p-0 backdrop:bg-black/70"
      style={{ background: 'var(--bg2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
    >
      <div className="flex items-start justify-between gap-6 border-b p-6" style={{ borderColor: 'var(--line)' }}>
        <h2 id={idTitre} className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>
          {titre}
        </h2>
        <button
          type="button"
          onClick={onFermer}
          aria-label={t('fermer')}
          className="rounded-full px-2 text-2xl leading-none transition hover:opacity-60"
        >
          ×
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  )
}
