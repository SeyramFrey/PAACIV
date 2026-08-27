import { Link } from '@/i18n/navigation'
import { champ } from '@/lib/i18n-champ'
import type { ArchitecteListItem } from '@/lib/data/architectes'

// Grille de portraits, façon trombinoscope d'agence : le visage d'abord, le nom
// dessous, la fonction en dessous encore.
//
// Ce qui change par rapport à la pastille ronde d'avant, et pourquoi : une
// vignette de 64 px ne montre pas un visage, elle montre une tache. Sur un site
// dont le sujet est la mémoire de personnes, la photographie doit porter la
// page — c'est le même parti que sur la fiche, où le portrait ouvre désormais
// l'écran.
//
// Les portraits sont désaturés, comme sur la fiche : le corpus mêle des tirages
// d'archive en noir et blanc et des photographies récentes en couleur, et les
// aligner évite qu'une grille ressemble à un patchwork. Le cadre reste sur
// `--bg2` : une photo détourée sur fond blanc, très fréquente dans ces
// archives, ne doit pas flotter dans le vide.
export function PastilleArchitecte({
  a,
  locale,
}: {
  a: ArchitecteListItem
  locale: string
}) {
  const initiales = a.nom
    .split(' ')
    .map((m) => m[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // La fonction si on la connaît ; à défaut la période, puis l'année. Une
  // seconde ligne vide creuserait un trou dans la grille — mais inventer un
  // libellé serait pire, d'où le repli sur ce qu'on sait vraiment.
  const fonction = champ(a.profession_fr, a.profession_en, locale) ||
    a.periode_texte ||
    (a.annee_naissance ? String(a.annee_naissance) : '')

  return (
    <Link
      href={`/architectes/${a.slug}`}
      data-testid="pastille-architecte"
      aria-label={a.nom}
      className="group block"
    >
      <div className="aspect-square overflow-hidden" style={{ background: 'var(--bg2)' }}>
        {a.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.photo}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover object-[50%_25%] transition-transform duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.03]"
            style={{ filter: 'grayscale(1) contrast(1.06)' }}
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center font-serif text-3xl"
            style={{ color: 'var(--soft)' }}
          >
            {initiales}
          </span>
        )}
      </div>
      {/* `alt=""` sur l'image et le nom en texte : le lien porte déjà
          `aria-label`, et décrire la photographie en plus ferait annoncer le
          nom deux fois. */}
      <p
        className="mt-2.5 text-sm transition-colors group-hover:text-terra"
        style={{ color: 'var(--ink)' }}
      >
        {a.nom}
      </p>
      {fonction && (
        <p className="mt-0.5 text-[11px] leading-snug" style={{ color: 'var(--soft)' }}>
          {fonction}
        </p>
      )}
    </Link>
  )
}
