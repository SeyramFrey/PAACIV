import { Fragment } from 'react'
import { Link } from '@/i18n/navigation'
import { slugify } from '@/lib/slug'

// Une piste du bandeau : une copie de la liste des villes séparée par
// l'emblème de l'association. La seconde copie (voir plus bas) porte
// `aria-hidden` — elle n'existe que pour que la boucle de défilement paraisse
// continue.
function Piste({ villes, cache = false }: { villes: string[]; cache?: boolean }) {
  return (
    <div
      aria-hidden={cache ? 'true' : undefined}
      className="flex items-center gap-8 pr-8 font-serif text-[20px] leading-none whitespace-nowrap"
      style={{ color: 'var(--ink)' }}
    >
      {villes.map((ville) => (
        <Fragment key={ville}>
          {/* Les noms mènent aux pages de commune depuis qu'elles existent —
              c'est le geste que le bandeau appelait déjà, chaque ville y étant
              écrite comme une destination.

              MAIS SEULEMENT DANS LA PISTE VISIBLE. Un lien reste focalisable au
              clavier même sous `aria-hidden` : dupliquer les liens dans la
              copie de défilement obligerait à traverser deux fois la liste au
              clavier, dont une fois dans un contenu que le lecteur d'écran
              n'annonce pas — un piège de focalisation silencieux. La copie
              cachée reste donc du texte inerte, ce qui suffit à son office :
              donner l'illusion d'une boucle continue. */}
          {cache ? (
            <span>{ville}</span>
          ) : (
            <Link
              href={`/villes/${slugify(ville)}`}
              className="transition-colors hover:text-[var(--accent)] focus-visible:text-[var(--accent)]"
              style={{ color: 'inherit' }}
            >
              {ville}
            </Link>
          )}
          {/* Séparateur purement décoratif : `alt=""` ET `aria-hidden`, sinon
              un lecteur d'écran énumérerait l'emblème entre chaque ville.
              Dimensions fixées en attributs autant qu'en classes : elles
              réservent la place avant le chargement, sans quoi le bandeau
              sauterait à l'arrivée des images. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/separateur.png"
            alt=""
            aria-hidden="true"
            width={26}
            height={26}
            loading="lazy"
            decoding="async"
            className="h-[26px] w-[26px] shrink-0"
          />
        </Fragment>
      ))}
    </div>
  )
}

export function BandeauVilles({ villes }: { villes: string[] }) {
  // En dessous de trois villes, un marquee de deux mots tourne de façon
  // absurde : on ne rend pas le bandeau plutôt que d'afficher ça.
  if (villes.length < 3) return null

  return (
    <div className="overflow-hidden border-y py-[22px]" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
      {/* `data-mq` : neutralisé par la règle `prefers-reduced-motion` de
          globals.css (`[data-mq] { animation: none !important }`).
          `hover:[animation-play-state:paused]` : le bandeau devient cliquable,
          et viser un lien qui défile est impossible. Il s'arrête donc sous le
          pointeur, et sous le focus clavier — sans quoi tabuler dans la piste
          y amènerait un lien qui continue de fuir. */}
      <div
        data-mq=""
        className="flex w-max hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]"
        style={{ animation: 'mq 38s linear infinite', willChange: 'transform' }}
      >
        <Piste villes={villes} />
        <Piste villes={villes} cache />
      </div>
    </div>
  )
}
