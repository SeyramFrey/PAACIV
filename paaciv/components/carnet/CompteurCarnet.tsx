'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useCarnet } from '@/components/carnet/useCarnet'

// « Carnet · 3 » dans l'en-tête (le « My Enquiry (0) » de Southern Guild).
// Absent tant que le carnet est vide : un compteur à zéro n'apprend rien au
// visiteur et prend une place précieuse sur un téléphone. Il apparaît dès la
// première fiche ouverte.
export function CompteurCarnet() {
  const t = useTranslations('carnet')
  const n = useCarnet().length
  if (n === 0) return null
  return (
    <Link
      href="/carnet"
      data-testid="compteur-carnet"
      aria-label={t('compteurAria', { n })}
      // Masqué sous 640 px : l'en-tête d'un téléphone n'a de place que pour le
      // logo et le menu, où le carnet a sa propre entrée.
      className="hidden whitespace-nowrap rounded-full sm:inline-block border px-3.5 py-2 text-sm transition hover:bg-[var(--accent)] hover:text-[var(--surAccent)]"
      style={{ color: 'inherit', borderColor: 'color-mix(in oklab, currentColor 35%, transparent)' }}
    >
      {t('compteur', { n })}
    </Link>
  )
}
