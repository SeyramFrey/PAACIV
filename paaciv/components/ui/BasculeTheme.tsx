'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

export function BasculeTheme({ className }: { className?: string }) {
  const t = useTranslations('theme')
  const [sombre, setSombre] = useState(true)

  // L'attribut est déjà posé par ScriptTheme au chargement : on se contente
  // de lire l'état réel du document pour synchroniser le bouton, sans jamais
  // réécrire l'attribut au montage (ce qui écraserait la préférence).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronisation post-montage avec l'attribut DOM posé par ScriptTheme avant l'hydratation (SSR toujours "sombre" par défaut) ; lire cette valeur pendant le rendu casserait l'hydratation.
    setSombre(document.documentElement.getAttribute('data-theme') !== 'light')
  }, [])

  function basculer() {
    const suivant = sombre ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', suivant)
    try {
      localStorage.setItem('paaciv-theme', suivant)
    } catch {
      // Navigation privée ou stockage plein : la bascule reste effective pour
      // la session, seule la mémorisation est perdue.
    }
    setSombre(!sombre)
  }

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={t('basculer')}
      aria-pressed={sombre}
      className={className}
    >
      <span
        aria-hidden="true"
        className="block h-4 w-4 rounded-full border border-current"
        style={{ boxShadow: sombre ? 'inset -4px -3px 0 0 currentColor' : 'none' }}
      />
    </button>
  )
}
