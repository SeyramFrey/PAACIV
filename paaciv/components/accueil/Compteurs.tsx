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
    <dl className="flex flex-wrap justify-center gap-[clamp(28px,5vw,72px)]">
      {lignes.map((l) => (
        // `flex-col-reverse` : le DOM porte `<dt>` avant `<dd>` (modèle de
        // contenu correct, ordre d'annonce correct pour les lecteurs
        // d'écran), tandis que l'affichage garde le grand nombre au-dessus
        // du libellé, comme la maquette.
        <div key={l.libelle} className="flex flex-col-reverse items-center gap-2">
          <dt className="text-[10px] font-medium uppercase leading-none tracking-[0.2em]" style={{ color: 'var(--soft)' }}>
            {l.libelle}
          </dt>
          <dd className="m-0">
            {/* Doublon accessible : l'élément animé est masqué aux
                technologies d'assistance — le moteur de Revelations réécrit
                son texte à chaque palier (~40 par seconde), donc un
                utilisateur qui arrive en cours d'animation s'entendrait
                annoncer un nombre faux. Le `sr-only` porte la valeur finale,
                stable dès le premier rendu. */}
            <span
              aria-hidden="true"
              data-count={l.valeur}
              data-testid="compteur"
              className="block font-serif text-[clamp(34px,4vw,60px)] leading-none"
              style={{ color: 'var(--terra)' }}
            >
              0
            </span>
            <span className="sr-only">{l.valeur}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
