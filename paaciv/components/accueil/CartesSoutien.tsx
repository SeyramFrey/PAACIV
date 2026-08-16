'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useSoutien } from '@/components/soutenir/ContexteSoutien'
import type { EtatConservation } from '@/lib/etats-conservation'

const CLASSE_CARTE =
  'group relative flex h-[clamp(340px,34vw,440px)] flex-col justify-end overflow-hidden rounded-[6px] border-0 bg-transparent p-[34px] text-left'

type Href = { pathname: '/archives'; query: { etat: EtatConservation } }

function Carte({
  href,
  onClick,
  image,
  titre,
  texte,
  libelle,
  delai,
}: {
  // Forme objet et non chaîne : `Link` préfixe la langue au `pathname` seul.
  // Une chaîne « /archives?etat=demoli » ferait porter le préfixe à l'URL
  // entière, requête comprise.
  href?: Href
  onClick?: () => void
  // Optionnelle. Les trois images existantes sont des liens directs vers
  // Wikimedia, sans attribution ni licence — dette déjà consignée, et qu'on
  // n'aggrave pas d'une quatrième pour la carte « démoli ». Sans image, la
  // carte tombe sur un aplat sombre, qui porte le dégradé et le texte aussi
  // bien que la photo.
  image?: string
  titre: string
  // `null` : rien à afficher (valeur absente ou encore marquée « À
  // COMPLÉTER ») — le paragraphe entier disparaît plutôt que de montrer un
  // avantage ou un chiffre inventé.
  texte: string | null
  libelle: string
  delai?: string
}) {
  // Décoratives : le titre de la carte est déjà porté en texte visible juste
  // au-dessus, dans le même bloc cliquable — un `alt` non vide le
  // dupliquerait dans le nom accessible du lien/bouton (cf. CarteFilm.tsx).
  const contenu = (
    <>
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
          style={{ filter: 'var(--imgf)' }}
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: 'oklch(0.24 0.03 46)' }}
        />
      )}
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, transparent 20%, oklch(0.14 0.02 46 / 0.82))' }}
      />
      <span className="relative font-serif text-[clamp(26px,2.4vw,34px)] leading-[1.1]">{titre}</span>
      {texte && (
        <span className="relative mt-2.5 max-w-[280px] text-sm font-light leading-[1.6] opacity-[.82]">
          {texte}
        </span>
      )}
      <span
        className="relative mt-5 self-start rounded-full border px-5 py-[11px] text-[10px] font-semibold uppercase leading-none tracking-[0.18em]"
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

export function CartesSoutien({
  montant,
  enDangerTexte,
  demoliTexte,
  adhesionAvantages,
  donTexte,
  nbEnDanger,
  nbDemoli,
  titres,
}: {
  // `null` : rien à afficher — déjà filtré côté serveur par `Association.tsx`
  // (une valeur absente ou encore « À COMPLÉTER » ne franchit jamais la
  // frontière serveur/client, pour ne jamais atteindre le HTML envoyé au
  // navigateur).
  montant: string | null
  enDangerTexte: string | null
  demoliTexte: string | null
  adhesionAvantages: string | null
  donTexte: string | null
  // Nombre de fiches publiées dans chaque état. À zéro, la carte disparaît
  // plutôt que de mener vers « Aucun résultat » : la carte est une promesse de
  // contenu, et une promesse vide se remarque plus qu'une carte absente. Les
  // deux réapparaissent d'elles-mêmes dès qu'une fiche est classée en admin.
  nbEnDanger: number
  nbDemoli: number
  // Titres des quatre cartes, éditables depuis l'admin. Chaque entrée à `null`
  // retombe sur le libellé du code : une carte sans titre serait une image
  // muette dont on ne saurait pas où elle mène.
  titres: Record<'enDanger' | 'demoli' | 'adhesion' | 'don', string | null>
}) {
  const t = useTranslations('accueil')
  const { ouvrir } = useSoutien()

  // Le montant et les avantages viennent de deux clés `contenu_site`
  // indépendantes : chacune peut manquer sans l'autre. On les assemble
  // seulement si au moins l'une des deux est renseignée — jamais de gabarit
  // « {montant} par an. » affiché seul avec un montant à blanc, jamais
  // d'avantages promis pendant qu'aucun prix n'existe encore.
  const segmentsAdhesion = [
    montant ? t('montantParAn', { montant }) : null,
    adhesionAvantages,
  ].filter((s): s is string => Boolean(s))
  const texteAdhesion = segmentsAdhesion.length > 0 ? segmentsAdhesion.join(' ') : null

  // Cartes décrites puis filtrées, plutôt que quatre blocs JSX sous condition :
  // le délai de révélation doit rester la POSITION de la carte dans la grille.
  // Écrit en dur sur chaque bloc, il se télescopait dès qu'une carte d'état
  // manquait — deux cartes voisines animées ensemble, un trou de 90 ms après.
  //
  // Le filtrage est sûr vis-à-vis de `Revelations` (qui ne scanne qu'une fois
  // par route, puis `unobserve`) : `nbEnDanger`/`nbDemoli` sont calculés côté
  // serveur et arrivent en props, donc le premier rendu client contient déjà
  // exactement les cartes visibles — aucun `data-rv` n'apparaît après le scan.
  const cartes = [
    nbEnDanger > 0 && {
      cle: 'en_danger',
      href: { pathname: '/archives', query: { etat: 'en_danger' } } as const,
      image:
        "https://commons.wikimedia.org/wiki/Special:FilePath/L'hopital%20colonial%20europeen%20(construit%20en%201905%2C%20il%20a%20ete%20le%201er%20hopital%20moderne%20en%20CI).jpg?width=900",
      titre: titres.enDanger ?? t('enDanger'),
      texte: enDangerTexte,
      libelle: t('voir'),
    },
    nbDemoli > 0 && {
      cle: 'demoli',
      href: { pathname: '/archives', query: { etat: 'demoli' } } as const,
      // Sans photographie : voir le commentaire sur `image` dans `Carte`.
      image: undefined,
      titre: titres.demoli ?? t('demoli'),
      texte: demoliTexte,
      libelle: t('voir'),
    },
    {
      cle: 'adhesion',
      onClick: () => ouvrir('adhesion'),
      image:
        "https://commons.wikimedia.org/wiki/Special:FilePath/WikiConvFr23%20en%20Cote%20d'Ivoire%20visite%20B%C3%A2timents%20sites%20historiques%20de%20Grand-Bassam%2002.jpg?width=900",
      titre: titres.adhesion ?? t('adherer'),
      texte: texteAdhesion,
      libelle: t('rejoindre'),
    },
    {
      cle: 'don',
      onClick: () => ouvrir('don'),
      image:
        'https://commons.wikimedia.org/wiki/Special:FilePath/Le%20Puits%20de%20la%20Mosqu%C3%A9e%20Dieng%201.jpg?width=900',
      titre: titres.don ?? t('don'),
      texte: donTexte,
      libelle: t('donner'),
    },
  ].filter((c): c is Exclude<typeof c, false> => c !== false)

  return (
    <div className="mt-[clamp(56px,7vw,96px)] grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[clamp(16px,2vw,28px)]">
      {cartes.map((c, i) => (
        <Carte
          key={c.cle}
          href={'href' in c ? c.href : undefined}
          onClick={'onClick' in c ? c.onClick : undefined}
          image={c.image}
          titre={c.titre}
          texte={c.texte}
          libelle={c.libelle}
          delai={i === 0 ? undefined : String(i * 90)}
        />
      ))}
    </div>
  )
}
