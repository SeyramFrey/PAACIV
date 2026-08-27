import { getTranslations } from 'next-intl/server'

export type EntreeSommaire = { id: string; libelle: string }

// Barre de sommaire collante (maquette : `position:sticky;top:62px`).
//
// `top` vaut ici la hauteur RÉELLE de l'en-tête fixe du site, via la variable
// posée dans globals.css — la maquette, elle, avait son propre en-tête d'une
// autre hauteur. Une valeur en dur reproduirait ici le défaut qu'on vient de
// corriger ailleurs : un sommaire calé sous une barre dont il ignore la taille
// passe dessous au défilement.
//
// Le sommaire ne liste que les sections RÉELLEMENT rendues : un lien
// « Réalisations » qui saute dans le vide sur la fiche d'un architecte sans
// œuvre documentée est pire que pas de lien du tout. La liste lui est donc
// fournie par la page, qui seule sait ce qu'elle a rendu.
export async function SommaireFiche({ entrees }: { entrees: EntreeSommaire[] }) {
  const t = await getTranslations('ficheArchitecte')
  // Un seul lien n'est pas un sommaire.
  if (entrees.length < 2) return null

  return (
    <nav
      aria-label={t('sommaire')}
      className="sticky z-40 flex items-center gap-[clamp(14px,2.4vw,34px)] overflow-x-auto border-b px-[clamp(20px,4vw,54px)] py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-[12px]"
      style={{
        top: 'var(--hauteur-entete)',
        background: 'color-mix(in oklab, var(--bg) 88%, transparent)',
        borderColor: 'var(--line)',
      }}
    >
      <span className="whitespace-nowrap" style={{ color: 'var(--soft)' }}>
        {t('sommaire')}
      </span>
      {entrees.map((e) => (
        <a
          key={e.id}
          href={`#${e.id}`}
          className="whitespace-nowrap transition-colors hover:text-terra"
          style={{ color: 'var(--ink)' }}
        >
          {e.libelle}
        </a>
      ))}
    </nav>
  )
}
