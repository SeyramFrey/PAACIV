'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'

// Témoin d'enregistrement réussi, commun à TOUS les écrans d'administration.
//
// Les huit formulaires d'admin redirigeaient en silence après un enregistrement
// réussi : l'administrateur revenait sur la liste sans savoir si son travail
// avait été pris en compte — le seul retour existant était le message d'ERREUR.
// Le seul écran qui affichait un témoin était `contenu`, parce qu'il n'est pas
// suivi d'une redirection.
//
// Le témoin passe par l'URL (`?enregistre=1`) plutôt que par un état React :
// l'enregistrement s'achève par une NAVIGATION, qui démonte le formulaire et
// emporterait tout état local avec lui. Monté dans le gabarit d'admin, ce
// composant reçoit le témoin quelle que soit la page d'arrivée.
export function BanniereEnregistre() {
  const params = useSearchParams()
  const router = useRouter()
  const chemin = usePathname()
  const t = useTranslations('admin')
  const affiche = params.get('enregistre') === '1'

  // Le paramètre est retiré de l'URL une fois le message posé : sans cela,
  // recharger la page — ou la mettre en favori — réafficherait « Enregistré. »
  // sans que rien n'ait été enregistré. `replace` et non `push`, pour ne pas
  // empiler une entrée d'historique par enregistrement.
  useEffect(() => {
    if (!affiche) return
    const id = window.setTimeout(() => router.replace(chemin), 4000)
    return () => window.clearTimeout(id)
  }, [affiche, router, chemin])

  if (!affiche) return null

  return (
    <p
      role="status"
      data-testid="banniere-enregistre"
      className="mb-6 rounded-xl border px-4 py-3 text-sm font-semibold"
      style={{
        borderColor: 'color-mix(in oklab, var(--vert) 45%, transparent)',
        background: 'color-mix(in oklab, var(--vert) 12%, transparent)',
        color: 'var(--ink)',
      }}
    >
      {t('enregistre')}
    </p>
  )
}
