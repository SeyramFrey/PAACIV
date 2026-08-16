'use client'

import { createContext, useContext, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Modal } from '@/components/ui/Modal'
import { FormulaireSoutien } from '@/components/soutenir/FormulaireSoutien'
import type { TypeDemande } from '@/app/[locale]/actions/soutien'

type Ctx = { ouvrir: (type: TypeDemande) => void }
const ContexteSoutien = createContext<Ctx | null>(null)

// Les trois modales sont montées une seule fois, en haut de la page. Sans ce
// contexte, chaque bouton déclencheur devrait porter sa propre copie de la
// modale — trois formulaires dupliqués, et des états de saisie qui se
// perdraient à chaque changement de bloc.
export function useSoutien(): Ctx {
  const c = useContext(ContexteSoutien)
  if (!c) throw new Error('useSoutien doit être utilisé dans <FournisseurSoutien>')
  return c
}

export function FournisseurSoutien({
  paiement,
  children,
}: {
  // `null` : valeur absente ou encore « À COMPLÉTER », déjà filtrée côté
  // serveur par `app/[locale]/layout.tsx` avant de franchir la frontière
  // client.
  paiement: string | null
  children: React.ReactNode
}) {
  const t = useTranslations('soutien')
  const [type, setType] = useState<TypeDemande | null>(null)

  return (
    <ContexteSoutien.Provider value={{ ouvrir: setType }}>
      {children}
      {(['adhesion', 'don', 'archive'] as const).map((x) => (
        <Modal key={x} ouvert={type === x} onFermer={() => setType(null)} titre={t(x)}>
          {/* La clé force le remontage à chaque ouverture : sans elle, un
              formulaire déjà envoyé rouvrirait sur son écran de confirmation. */}
          <FormulaireSoutien key={`${x}-${type === x}`} type={x} paiement={paiement} />
        </Modal>
      ))}
    </ContexteSoutien.Provider>
  )
}
