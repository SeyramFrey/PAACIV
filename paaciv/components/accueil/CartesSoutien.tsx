'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useSoutien } from '@/components/soutenir/ContexteSoutien'

// Une valeur encore marquée « À COMPLÉTER » (contenu_site.soutien_adhesion_montant,
// en attente d'être renseignée par l'association) est un chantier interne :
// elle ne doit jamais atteindre un visiteur. Même garde que SiteFooter.tsx.
function renseigne(valeur: string): boolean {
  return valeur.length > 0 && !valeur.startsWith('À COMPLÉTER')
}

const CLASSE_CARTE =
  'group relative flex h-[clamp(340px,34vw,440px)] flex-col justify-end overflow-hidden rounded-[6px] border-0 bg-transparent p-[34px] text-left'

function Carte({
  href,
  onClick,
  image,
  titre,
  texte,
  libelle,
  delai,
}: {
  href?: string
  onClick?: () => void
  image: string
  titre: string
  texte: string
  libelle: string
  delai?: string
}) {
  // Décoratives : le titre de la carte est déjà porté en texte visible juste
  // au-dessus, dans le même bloc cliquable — un `alt` non vide le
  // dupliquerait dans le nom accessible du lien/bouton (cf. CarteFilm.tsx).
  const contenu = (
    <>
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
        style={{ filter: 'var(--imgf)' }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, transparent 20%, oklch(0.14 0.02 46 / 0.82))' }}
      />
      <span className="relative font-serif text-[clamp(26px,2.4vw,34px)] leading-[1.1]">{titre}</span>
      <span className="relative mt-2.5 max-w-[280px] text-sm font-light leading-[1.6] opacity-80">{texte}</span>
      <span
        className="relative mt-5 self-start rounded-full border px-5 py-[11px] text-[10px] font-semibold uppercase tracking-[0.18em]"
        style={{ borderColor: 'color-mix(in oklab, var(--onDeep) 50%, transparent)' }}
      >
        {libelle}
      </span>
    </>
  )

  if (href) {
    return (
      <Link href={href} data-rv="" data-d={delai} className={CLASSE_CARTE} style={{ color: 'var(--onDeep)' }}>
        {contenu}
      </Link>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      data-rv=""
      data-d={delai}
      className={CLASSE_CARTE}
      style={{ color: 'var(--onDeep)' }}
    >
      {contenu}
    </button>
  )
}

export function CartesSoutien({ montant }: { montant: string }) {
  const t = useTranslations('accueil')
  const { ouvrir } = useSoutien()

  const texteAdhesion = renseigne(montant)
    ? t('adhererTexteAvecMontant', { montant })
    : t('adhererTexteSansMontant')

  return (
    <div className="mt-[clamp(56px,7vw,96px)] grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[clamp(16px,2vw,28px)]">
      <Carte
        href="/articles"
        image="https://commons.wikimedia.org/wiki/Special:FilePath/L'hopital%20colonial%20europeen%20(construit%20en%201905%2C%20il%20a%20ete%20le%201er%20hopital%20moderne%20en%20CI).jpg?width=900"
        titre={t('chantiers')}
        texte={t('chantiersTexte')}
        libelle={t('voir')}
      />
      <Carte
        onClick={() => ouvrir('adhesion')}
        image="https://commons.wikimedia.org/wiki/Special:FilePath/WikiConvFr23%20en%20Cote%20d'Ivoire%20visite%20B%C3%A2timents%20sites%20historiques%20de%20Grand-Bassam%2002.jpg?width=900"
        titre={t('adherer')}
        texte={texteAdhesion}
        libelle={t('rejoindre')}
        delai="90"
      />
      <Carte
        onClick={() => ouvrir('don')}
        image="https://commons.wikimedia.org/wiki/Special:FilePath/Le%20Puits%20de%20la%20Mosqu%C3%A9e%20Dieng%201.jpg?width=900"
        titre={t('don')}
        texte={t('donTexte')}
        libelle={t('donner')}
        delai="180"
      />
    </div>
  )
}
