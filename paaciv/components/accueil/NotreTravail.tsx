import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { texte, type Textes } from '@/lib/data/contenu-site'
import { visuel, type Medias } from '@/lib/data/medias'

// Visuels de SECOURS : la base les recouvre (`medias_site`), le code garde de
// quoi s'afficher si la ligne est supprimée depuis l'admin — ce bloc est bâti
// autour de ses deux images, il s'effondrerait sans elles.
const SECOURS_1 =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Maison%20du%20Resident%20(c'etait%20le%20logement%20du%20directeur%20de%20l'ecole%20regionale%20a%20l'epoque%20coloniale).jpg?width=1100"
const SECOURS_2 =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Int%C3%A9rieur%20Mosqu%C3%A9e%20Dieng%20%C3%A0%20Grand-Bassam.jpg?width=1100"

export async function NotreTravail({ textes, medias }: { textes: Textes; medias: Medias }) {
  const locale = await getLocale()
  const t = await getTranslations('accueil')

  const surtitre = texte(textes, 'travail_surtitre', locale)
  const titre = texte(textes, 'travail_titre', locale)
  const intro = texte(textes, 'travail_texte', locale)
  const releveTitre = texte(textes, 'travail_releve_titre', locale)
  const releveTexte = texte(textes, 'travail_releve_texte', locale)
  // La base recouvre le visuel codé ; l'`alt` vient d'elle aussi, et devient
  // enfin bilingue — il était écrit en français quelle que soit la langue.
  const image1 = visuel(medias, 'travail_1_image', locale, SECOURS_1)
  const image2 = visuel(medias, 'travail_2_image', locale, SECOURS_2)
  const recitTitre = texte(textes, 'travail_recit_titre', locale)
  const recitTexte = texte(textes, 'travail_recit_texte', locale)

  return (
    <section className="relative overflow-hidden px-[clamp(20px,5vw,80px)] py-[clamp(60px,7vw,110px)]">
      {/* Filigrane : l'emblème de l'association, très en retrait derrière le
          bloc. `aria-hidden` et `pointer-events-none` — c'est une texture, il
          ne doit ni être annoncé, ni intercepter un clic destiné au contenu.
          L'opacité est délibérément basse : le dessin est dense et coloré, et à
          pleine force il rendrait le texte illisible. Il est posé sous un
          `z-0` explicite, le contenu sous `z-10`, faute de quoi l'ordre
          d'empilement dépendrait de l'ordre du DOM et un futur déplacement de
          bloc ferait passer le filigrane devant. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/embleme-fond.png"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[clamp(460px,62vw,900px)] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.07]"
      />
      <div className="relative z-10 mx-auto grid max-w-[1440px] grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-[clamp(24px,3vw,48px)]">
        <div data-clip="" data-par="0.06" className="h-[clamp(320px,36vw,520px)] overflow-hidden rounded-[6px]">
          <img
            src={image1.src}
            alt={image1.alt}
            loading="lazy"
            className="h-full w-full object-cover"
            style={{ filter: 'var(--imgf)' }}
          />
        </div>

        <div className="p-[clamp(8px,2vw,32px)]">
          <p
            data-rv=""
            className="mb-[18px] text-[11px] font-medium uppercase leading-none tracking-[0.3em]"
            style={{ color: 'var(--ocre)' }}
          >
            {surtitre}
          </p>
          <h2
            data-rv=""
            data-d="60"
            className="m-0 font-serif text-[clamp(32px,3.6vw,58px)] leading-[1.06] tracking-[-0.015em]"
            style={{ color: 'var(--ink)' }}
          >
            {titre}
          </h2>
          <p
            data-rv=""
            data-d="120"
            className="mt-[22px] text-base font-light leading-[1.8]"
            style={{ color: 'var(--soft)' }}
          >
            {intro}
          </p>
          <div data-rv="" data-d="180" className="mt-[34px] grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-5">
            <div className="border-t pt-3.5" style={{ borderColor: 'var(--line)' }}>
              <p className="m-0 text-xs font-medium uppercase leading-none tracking-[0.14em]" style={{ color: 'var(--ink)' }}>
                {releveTitre}
              </p>
              <p className="mt-2 text-sm font-light leading-[1.6]" style={{ color: 'var(--soft)' }}>
                {releveTexte}
              </p>
            </div>
            <div className="border-t pt-3.5" style={{ borderColor: 'var(--line)' }}>
              <p className="m-0 text-xs font-medium uppercase leading-none tracking-[0.14em]" style={{ color: 'var(--ink)' }}>
                {recitTitre}
              </p>
              <p className="mt-2 text-sm font-light leading-[1.6]" style={{ color: 'var(--soft)' }}>
                {recitTexte}
              </p>
            </div>
          </div>
          <Link
            href="/archives"
            data-rv=""
            data-d="240"
            className="mt-[34px] inline-flex items-center gap-2.5 border-b pb-1.5 text-[11px] font-semibold uppercase leading-none tracking-[0.2em]"
            style={{ borderColor: 'var(--terra)' }}
          >
            {t('enSavoirPlus')} <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div data-clip="" data-d="120" data-par="-0.05" className="h-[clamp(320px,36vw,520px)] overflow-hidden rounded-[6px]">
          <img
            src={image2.src}
            alt={image2.alt}
            loading="lazy"
            className="h-full w-full object-cover"
            style={{ filter: 'var(--imgf)' }}
          />
        </div>
      </div>
    </section>
  )
}
