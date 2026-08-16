import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { texte, libelleOuNull, type Textes } from '@/lib/data/contenu-site'
import { visuel, type Medias } from '@/lib/data/medias'
import { champ } from '@/lib/i18n-champ'
import type { PointCle } from '@/lib/data/accueil'

// Cinq photographies décoratives en collage (losanges), reprises telles
// quelles de la référence de design (lignes 334-338) : aucune n'est liée à
// une fiche precise, elles ne font qu'illustrer le bloc — même logique que
// les images fixes de NotreTravail.tsx et CartesSoutien.tsx.
const PHOTOS = [
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Maison%20des%20artistes%20plasticiens%20de%20Grand-Bassam.jpg?width=700",
    par: '0.12',
    style: { top: '6%', left: '6%', width: '38%' },
  },
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Le%20Puits%20de%20la%20Mosqu%C3%A9e%20Dieng%201.jpg?width=700",
    par: '-0.16',
    style: { top: '32%', left: '38%', width: '26%' },
  },
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Cath%C3%A9drale%20Saint-Paul%203.jpg?width=700",
    par: '0.2',
    style: { top: '8%', right: '2%', width: '30%' },
  },
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Basilique%20notre%20Dame%20de%20la%20Paix%20de%20Yamoussoukro%204.jpg?width=700",
    par: '-0.1',
    style: { bottom: '4%', left: '16%', width: '30%' },
  },
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Maison%20du%20Resident%20(c'etait%20le%20logement%20du%20directeur%20de%20l'ecole%20regionale%20a%20l'epoque%20coloniale).jpg?width=700",
    par: '0.08',
    style: { bottom: '10%', right: '8%', width: '22%' },
  },
] as const

// Délais échelonnés de la maquette (lignes 341-345 de la référence de
// design) : 0 (implicite), 80, 160, 240, 320 ms — au-delà de cinq entrées,
// les suivantes se révèlent sans délai plutôt que d'inventer une valeur
// absente de la maquette (même garde qu'à la Task 10, PourquoiNousSuivre.tsx).
const DELAIS: (string | undefined)[] = [undefined, '80', '160', '240', '320']

export async function CinqRaisons({
  points,
  textes,
  medias,
}: {
  points: PointCle[]
  textes: Textes
  medias: Medias
}) {
  // Aucune raison publiée : le bloc entier disparaît plutôt que d'afficher
  // un titre suivi d'une liste vide.
  if (points.length === 0) return null

  const locale = await getLocale()
  const t = await getTranslations('accueil')
  const surtitre = texte(textes, 'raisons_surtitre', locale)
  const titre = texte(textes, 'raisons_titre', locale)
  // Remplacement facultatif : le libellé du code reste le plancher garanti.
  const cta = libelleOuNull(textes, 'raisons_cta', locale) ?? t('voirProgramme')

  return (
    <section
      className="relative overflow-hidden px-[clamp(20px,5vw,80px)] py-[clamp(90px,10vw,150px)]"
      style={{ background: 'var(--deep)', color: 'var(--onDeep)' }}
    >
      {/* Halo décoratif. `oklch(0.79 0.14 74/.16)` de la maquette est une
          teinte jaune-or : remplacé par `--accent`, comme toute couleur
          « or » de la référence (contrainte globale « Aucun jaune »). */}
      <span
        aria-hidden="true"
        className="absolute -top-[120px] -right-[80px] h-[420px] w-[420px] rounded-full"
        style={{ background: 'radial-gradient(circle, color-mix(in oklab, var(--accent) 16%, transparent), transparent 65%)' }}
      />

      <div className="relative mx-auto max-w-[1440px]">
        <div className="mx-auto mb-[clamp(40px,6vw,80px)] max-w-[820px] text-center">
          <p
            data-rv=""
            className="m-0 mb-4 text-[11px] font-medium uppercase leading-none tracking-[0.3em]"
            style={{ color: 'var(--accent)' }}
          >
            {surtitre}
          </p>
          <h2
            data-rv=""
            data-d="60"
            className="m-0 text-balance font-serif text-[clamp(32px,4.6vw,70px)] leading-[1.04]"
          >
            {titre}
          </h2>
        </div>

        <div className="grid items-center gap-[clamp(28px,4vw,60px)] lg:grid-cols-2">
          <div className="relative h-[clamp(360px,40vw,540px)]">
            {PHOTOS.map((p, i) => {
              // `p.src` n'est plus la source mais le SECOURS : la base recouvre
              // le visuel codé, et le composant garde de quoi s'afficher si la
              // ligne est supprimée. Clé sur l'emplacement et non sur l'URL —
              // deux emplacements peuvent désormais pointer le même fichier.
              const v = visuel(medias, `raisons_${i + 1}_image`, locale, p.src)
              return (
                <div
                  key={i}
                  data-par={p.par}
                  className="absolute aspect-square overflow-hidden rotate-45 border"
                  style={{ ...p.style, borderColor: 'color-mix(in oklab, var(--accent) 35%, transparent)' }}
                >
                  <img
                    src={v.src}
                    alt={v.alt}
                    loading="lazy"
                    className="-m-[25%] h-[150%] w-[150%] -rotate-45 object-cover"
                    style={{ filter: 'var(--imgf)' }}
                  />
                </div>
              )
            })}
          </div>

          <ol
            className="m-0 flex list-none flex-col gap-[26px] border-l p-0 pl-[clamp(20px,3vw,40px)]"
            style={{ borderColor: 'color-mix(in oklab, var(--accent) 28%, transparent)' }}
          >
            {points.map((p, i) => (
              <li key={p.id} data-rv="" data-d={DELAIS[i]}>
                <p
                  className="m-0 text-[11px] font-medium leading-none tracking-[0.2em]"
                  style={{ color: 'var(--accent)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </p>
                <p
                  className="mt-2 text-[15px] font-light leading-[1.75]"
                  style={{ color: 'color-mix(in oklab, var(--onDeep) 82%, transparent)' }}
                >
                  {champ(p.texte_fr, p.texte_en, locale)}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-[clamp(40px,5vw,70px)] flex justify-center">
          {/* `borderColor`/`color` en attribut `style` gagneraient toujours
              sur le `:hover` de la feuille de style (un `color` inline
              l'emporte sur toute règle CSS, pseudo-classe comprise) : fond ET
              texte basculent donc tous deux en classes Tailwind, pas en
              `style`, sans quoi le survol de la maquette (349) — accent sur
              fond, encre sur accent — resterait accent sur accent, illisible. */}
          <Link
            href="/evenements"
            data-rv=""
            className="rounded-[2px] border border-[var(--accent)] px-[42px] py-[18px] text-[11px] font-semibold uppercase leading-none tracking-[0.24em] text-[var(--accent)] transition-colors duration-[0.45s] hover:bg-[var(--accent)] hover:text-[oklch(0.14_0.02_46)]"
          >
            {cta}
          </Link>
        </div>
      </div>
    </section>
  )
}
