'use client'

import { useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import { CLE_MODE_LEGER } from '@/lib/mode-leger'

const abonnes = new Set<() => void>()
function sAbonner(rappel: () => void) {
  abonnes.add(rappel)
  return () => {
    abonnes.delete(rappel)
  }
}

const actif = () => document.documentElement.hasAttribute('data-leger')

export function InterrupteurLeger() {
  const t = useTranslations('footer')
  const leger = useSyncExternalStore(sAbonner, actif, () => false)

  function basculer() {
    const racine = document.documentElement
    const suivant = !leger
    racine.toggleAttribute('data-leger', suivant)
    // Sans cela, le film resterait coupé jusqu'au prochain rechargement.
    if (!suivant && racine.getAttribute('data-intro') === 'sans') racine.setAttribute('data-intro', 'fin')
    try {
      localStorage.setItem(CLE_MODE_LEGER, suivant ? 'oui' : 'non')
    } catch {
      // Stockage indisponible : le choix vaut pour cette page seulement.
    }
    abonnes.forEach((rappel) => rappel())
  }

  return (
    <button
      type="button"
      aria-pressed={leger}
      onClick={basculer}
      className="rounded-full border px-3 py-1.5 text-sm transition hover:text-[var(--accent)]"
      style={{ borderColor: 'color-mix(in oklab, var(--onDeep) 35%, transparent)', color: 'inherit' }}
    >
      {t(leger ? 'modeLegerActif' : 'modeLeger')}
    </button>
  )
}
