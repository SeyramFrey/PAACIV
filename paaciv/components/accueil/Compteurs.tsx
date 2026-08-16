import { useTranslations } from 'next-intl'
import type { Chiffres } from '@/lib/data/accueil'

// Server Component : la valeur part à 0 dans le HTML et c'est Revelations
// (Task 2) qui l'anime jusqu'à `data-count` à l'entrée dans le viewport.
// Aucun JavaScript n'est expédié pour ce bloc.
export function Compteurs({ chiffres }: { chiffres: Chiffres }) {
  const t = useTranslations('accueil')
  const lignes = [
    { valeur: chiffres.fiches, libelle: t('chiffreFiches') },
    { valeur: chiffres.villes, libelle: t('chiffreVilles') },
    { valeur: chiffres.architectes, libelle: t('chiffreArchitectes') },
    { valeur: chiffres.articles, libelle: t('chiffreArticles') },
  ]

  return (
    <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
      {lignes.map((l) => (
        <div key={l.libelle}>
          <dd
            data-count={l.valeur}
            data-testid="compteur"
            className="font-serif text-5xl"
            style={{ color: 'var(--terra)' }}
          >
            0
          </dd>
          <dt className="mt-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--soft)' }}>
            {l.libelle}
          </dt>
        </div>
      ))}
    </dl>
  )
}
