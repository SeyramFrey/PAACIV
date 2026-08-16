import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { texte, type Textes } from '@/lib/data/contenu-site'

export async function NotreTravail({ textes }: { textes: Textes }) {
  const locale = await getLocale()
  const t = await getTranslations('accueil')

  const surtitre = texte(textes, 'travail_surtitre', locale)
  const titre = texte(textes, 'travail_titre', locale)
  const intro = texte(textes, 'travail_texte', locale)
  const releveTitre = texte(textes, 'travail_releve_titre', locale)
  const releveTexte = texte(textes, 'travail_releve_texte', locale)
  const recitTitre = texte(textes, 'travail_recit_titre', locale)
  const recitTexte = texte(textes, 'travail_recit_texte', locale)

  return (
    <section className="px-[clamp(20px,5vw,80px)] py-[clamp(60px,7vw,110px)]">
      <div className="mx-auto grid max-w-[1440px] grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-[clamp(24px,3vw,48px)]">
        <div data-clip="" data-par="0.06" className="h-[clamp(320px,36vw,520px)] overflow-hidden rounded-[6px]">
          <img
            src="https://commons.wikimedia.org/wiki/Special:FilePath/Maison%20du%20Resident%20(c'etait%20le%20logement%20du%20directeur%20de%20l'ecole%20regionale%20a%20l'epoque%20coloniale).jpg?width=1100"
            alt="Maison du Résident, Grand-Bassam"
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
            src="https://commons.wikimedia.org/wiki/Special:FilePath/Int%C3%A9rieur%20Mosqu%C3%A9e%20Dieng%20%C3%A0%20Grand-Bassam.jpg?width=1100"
            alt="Intérieur de la mosquée Dieng"
            loading="lazy"
            className="h-full w-full object-cover"
            style={{ filter: 'var(--imgf)' }}
          />
        </div>
      </div>
    </section>
  )
}
