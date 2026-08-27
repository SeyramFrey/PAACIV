import { getTranslations } from 'next-intl/server'
import { champ } from '@/lib/i18n-champ'
import type { ArchitecteDetail } from '@/lib/data/architectes'

// Transposition de la section `#fiche` de la maquette « Architecte Aka Adjo ».
//
// Trois écarts assumés, tous imposés par des décisions déjà prises ici :
//
//  1. `--gold` n'existe pas et n'existera pas : `app/globals.css` bannit toute
//     teinte entre 85 et 110, et le doré de la maquette est en 86/90. Il
//     devient `--accent`, comme il l'est déjà devenu dans Temoignages.tsx et
//     AppelArchives.tsx — même contrainte, même résolution.
//  2. La maquette pose son propre en-tête et son propre pied de page. Le site
//     en a déjà, et SiteHeader sait maintenant se fondre sur un hero sombre
//     (repère `id="top"`). On ne duplique donc ni l'un ni l'autre.
//  3. Instrument Serif / Karla deviennent Fraunces / Inter, les polices du
//     site. Ce qui fait la maquette ici, c'est l'échelle typographique et
//     l'interlettrage — pas la fonderie ; deux pages voisines dans deux
//     familles différentes se verraient bien plus qu'un empattement changé.

// Découpe le nom en lignes pour le titre à trois étages de la maquette
// (« Raymond » / « Aka » / « Adjo »). Le deuxième mot est mis en couleur, comme
// dans la référence. Un nom d'un seul mot rend une seule ligne : la
// composition ne casse pas, elle se réduit.
export function lignesDuNom(nom: string): string[] {
  const mots = nom.trim().split(/\s+/).filter(Boolean)
  if (mots.length <= 3) return mots
  // Au-delà de trois mots (« Michel Goly Kouassi » en a trois, mais un nom
  // à rallonge existera), les surnuméraires rejoignent la dernière ligne
  // plutôt que d'ajouter des étages à un titre déjà monumental.
  return [mots[0], mots[1], mots.slice(2).join(' ')]
}

type Ligne = { cle: string; libelle: string; valeur: string }

export async function HeroFiche({
  a,
  locale,
}: {
  a: ArchitecteDetail
  locale: string
}) {
  const t = await getTranslations('ficheArchitecte')
  const lignes = lignesDuNom(a.nom)

  const naissance = [
    a.annee_naissance ? String(a.annee_naissance) : null,
    a.lieu_naissance,
  ]
    .filter(Boolean)
    .join(', ')

  // Le tableau ne montre que les lignes RENSEIGNÉES. C'est ce qui permet au
  // même gabarit de servir la fiche la plus documentée du corpus comme la plus
  // maigre : une ligne vide dirait « on n'a pas cherché », une ligne absente ne
  // dit rien.
  const infos: Ligne[] = (
    [
      { cle: 'nom', libelle: t('nomComplet'), valeur: a.nom },
      { cle: 'naissance', libelle: t('naissance'), valeur: naissance },
      { cle: 'deces', libelle: t('deces'), valeur: a.annee_deces ? String(a.annee_deces) : '' },
      {
        cle: 'origine',
        libelle: t('origineChamp'),
        valeur: a.origine === 'ivoirien' ? t('ivoirien') : t('etranger'),
      },
      { cle: 'profession', libelle: t('profession'), valeur: champ(a.profession_fr, a.profession_en, locale) },
      { cle: 'periode', libelle: t('periode'), valeur: a.periode_texte ?? '' },
      { cle: 'agence', libelle: t('agence'), valeur: a.agence ?? '' },
      { cle: 'distinction', libelle: t('distinction'), valeur: champ(a.distinction_fr, a.distinction_en, locale) },
    ] as Ligne[]
  ).filter((l) => l.valeur.trim().length > 0)

  const chiffres = a.blocs.chiffre

  return (
    // `id="top"` : le repère que SiteHeader mesure pour rester transparent
    // tant que ce hero est derrière lui. Sans lui, l'en-tête serait opaque et
    // poserait une barre claire en travers du hero sombre.
    <section
      id="top"
      className="relative min-h-[100svh] overflow-hidden px-[clamp(20px,4vw,54px)] pb-[clamp(40px,6vw,90px)] pt-[clamp(110px,14vh,168px)]"
      style={{ background: 'var(--deep)', color: 'var(--onDeep)' }}
    >
      {/* Trame de papier millimétré (maquette : deux dégradés croisés de 64 px). */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(color-mix(in oklab, var(--accent) 7%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--accent) 7%, transparent) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[12%] -top-[18%] z-0 h-[60vw] w-[60vw]"
        style={{
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--accent) 16%, transparent), transparent 62%)',
        }}
      />
      {/* L'année en filigrane, en parallaxe. Elle n'est posée que si on connaît
          l'année de naissance — un filigrane vide serait un trou dans la
          composition, pas une sobriété. */}
      {a.annee_naissance && (
        <div
          aria-hidden="true"
          data-par="0.08"
          className="pointer-events-none absolute -bottom-[4%] right-[clamp(-40px,-2vw,0px)] z-0 font-serif text-[clamp(180px,30vw,460px)] leading-[0.8] tracking-[-0.04em]"
          style={{ color: 'color-mix(in oklab, var(--onDeep) 5%, transparent)' }}
        >
          {a.annee_naissance}
        </div>
      )}

      <div className="relative z-[2] mx-auto flex max-w-[1440px] flex-wrap items-start gap-[clamp(28px,4vw,70px)]">
        <div className="order-2 min-w-0 flex-[1_1_520px] lg:order-none">
          <div
            data-drop=""
            className="mb-[26px] flex items-center gap-3.5"
            style={{ animation: 'drop .9s .1s both cubic-bezier(.16,1,.3,1)' }}
          >
            <span
              className="rounded-full border px-3.5 py-[7px] text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{
                borderColor: 'color-mix(in oklab, var(--accent) 50%, transparent)',
                color: 'var(--accent)',
              }}
            >
              {t('surtitre')}
            </span>
            {a.periode_texte && (
              <span className="text-[10px] font-medium uppercase tracking-[0.24em] opacity-60">
                {a.periode_texte}
              </span>
            )}
          </div>

          {/* Chaque ligne du nom tombe dans un masque `overflow-hidden` : c'est
              ce qui donne l'entrée « par le bas » de la maquette, décalée de
              150 ms d'une ligne à l'autre. */}
          <h1 className="m-0 font-serif text-[clamp(54px,10.5vw,168px)] uppercase leading-[0.84] tracking-[-0.035em]">
            {lignes.map((mot, i) => (
              <span key={`${mot}-${i}`} className="block overflow-hidden">
                <span
                  data-drop=""
                  className="block"
                  style={{
                    color: i === 1 ? 'var(--accent)' : undefined,
                    animation: `drop 1.05s ${0.25 + i * 0.15}s both cubic-bezier(.16,1,.3,1)`,
                  }}
                >
                  {mot}
                </span>
              </span>
            ))}
          </h1>

          {infos.length > 0 && (
            <div
              data-drop=""
              className="mt-[clamp(34px,4vw,58px)]"
              style={{ animation: 'drop 1.05s .8s both cubic-bezier(.16,1,.3,1)' }}
            >
              <div className="mb-5 flex items-center gap-3.5">
                <h2
                  className="m-0 text-xs font-semibold uppercase tracking-[0.24em]"
                  style={{ color: 'var(--accent)' }}
                >
                  {t('infos')}
                </h2>
                <span
                  className="h-px flex-1"
                  style={{ background: 'color-mix(in oklab, var(--accent) 32%, transparent)' }}
                />
              </div>
              <dl className="m-0 grid gap-x-[34px] gap-y-0.5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                {infos.map((l) => (
                  <div
                    key={l.cle}
                    className="flex gap-2.5 border-b py-[9px]"
                    style={{ borderColor: 'color-mix(in oklab, var(--onDeep) 12%, transparent)' }}
                  >
                    {/* `shrink-0` ET `basis` : sans lui, un libellé plus long
                        que 112 px (l'anglais « Full name », ou une future
                        traduction) déborde sur la valeur au lieu de pousser la
                        colonne. `min-w` seul ne borne que le rétrécissement. */}
                    <dt className="w-[112px] shrink-0 text-xs font-semibold leading-normal opacity-55">
                      {l.libelle}
                    </dt>
                    <dd className="m-0 text-sm leading-normal">{l.valeur}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Sur téléphone, le portrait passe AVANT le nom et le tableau : une
            fiche de personne s'ouvre sur son visage, et le lire après huit
            lignes d'état civil inverse l'ordre de la rencontre. Les
            chiffres-clés, eux, sont de l'information — ils descendent APRÈS le
            nom, faute de quoi la photo ne serait « avant toute information »
            qu'à moitié.
            D'où le `contents` : sous `lg`, cette colonne s'efface de la mise en
            page et ses deux enfants deviennent des éléments flex du parent,
            ordonnables indépendamment (portrait 1, texte 2, chiffres 3). À
            partir de `lg` elle redevient une colonne et empile ses enfants
            comme dans la maquette, sans qu'un seul nœud soit dupliqué.
            L'animation est portée par les ENFANTS et non par ce conteneur :
            une boîte en `display: contents` ne génère aucun fragment, donc
            aucune animation ne s'y applique. */}
        <div
          className="contents lg:flex lg:min-w-0 lg:max-w-[420px] lg:flex-[1_1_300px] lg:flex-col lg:gap-[22px]"
        >
          {a.photo && (
            <div
              data-tilt=""
              data-drop=""
              className="relative order-1 border p-3.5 transition-transform duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] lg:order-none"
              style={{
                // Retard ramené de .5s à .2s : premier élément de la page sur
                // téléphone, le portrait ne peut pas apparaître après le texte
                // qui le suit.
                animation: 'drop 1.1s .2s both cubic-bezier(.16,1,.3,1)',
                background: 'color-mix(in oklab, var(--onDeep) 5%, transparent)',
                borderColor: 'color-mix(in oklab, var(--accent) 38%, transparent)',
              }}
            >
              {/* Les deux équerres d'angle de la maquette : un cadrage de
                  planche-contact, qui dit « pièce d'archive » sans le écrire. */}
              <span
                aria-hidden="true"
                className="absolute -left-[9px] -top-[9px] h-[34px] w-[34px] border-l border-t"
                style={{ borderColor: 'var(--accent)' }}
              />
              <span
                aria-hidden="true"
                className="absolute -bottom-[9px] -right-[9px] h-[34px] w-[34px] border-b border-r"
                style={{ borderColor: 'var(--accent)' }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.photo}
                alt={a.nom}
                className="aspect-square w-full object-cover [object-position:50%_27%]"
                style={{ filter: 'grayscale(1) contrast(1.08)' }}
              />
              <div className="mt-3 flex items-baseline justify-between gap-3">
                <span className="text-[9px] font-medium uppercase leading-[1.6] tracking-[0.2em] opacity-60">
                  {t('photoArchive')}
                </span>
                {a.annee_naissance && (
                  <span className="font-serif text-[15px] leading-none" style={{ color: 'var(--accent)' }}>
                    {a.annee_naissance}
                    {a.annee_deces ? ` – ${a.annee_deces}` : ' —'}
                  </span>
                )}
              </div>
            </div>
          )}

          {chiffres.length > 0 && (
            <div
              data-drop=""
              className="order-3 grid w-full gap-px [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))] lg:order-none lg:w-auto"
              style={{
                background: 'color-mix(in oklab, var(--onDeep) 14%, transparent)',
                animation: 'drop 1.1s .95s both cubic-bezier(.16,1,.3,1)',
              }}
            >
              {chiffres.map((c) => (
                <div key={c.id} className="px-4 py-[18px]" style={{ background: 'var(--deep)' }}>
                  <span
                    className="block font-serif text-[clamp(26px,3vw,40px)] leading-none"
                    style={{ color: 'var(--accent)' }}
                  >
                    {champ(c.titre_fr, c.titre_en, locale)}
                  </span>
                  <span className="text-[9px] font-medium uppercase leading-[1.5] tracking-[0.18em] opacity-60">
                    {champ(c.texte_fr, c.texte_en, locale)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
