import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { listeReportages, miniatureReportage } from '@/lib/data/reportages'
import { champ } from '@/lib/i18n-champ'

export async function CarteFilm() {
  const t = await getTranslations('accueil')
  const locale = await getLocale()
  const [dernier] = await listeReportages()
  // Aucun reportage publié : la carte disparaît plutôt que d'afficher un
  // cadre vide qui déséquilibrerait le raccord hero / bandeau.
  if (!dernier) return null

  const vignette = miniatureReportage(dernier.video_url)
  const titre = champ(dernier.titre_fr, dernier.titre_en, locale)
  const description = champ(dernier.description_fr, dernier.description_en, locale)

  return (
    <div className="relative z-[8] -mt-[88px] flex justify-end px-[clamp(20px,4vw,54px)]">
      <Link
        href={`/reportages/${dernier.slug}`}
        data-rv=""
        className="flex w-[min(430px,100%)] items-center gap-4 rounded-[6px] border p-3.5 transition hover:-translate-y-1"
        style={{
          background: 'var(--bg2)',
          borderColor: 'var(--line)',
          color: 'var(--ink)',
          boxShadow: '0 30px 60px -30px oklch(0.1 0.02 48 / 0.6)',
        }}
      >
        <div className="relative h-[88px] w-[132px] flex-none overflow-hidden rounded">
          {vignette ? (
            // Décorative : le titre est déjà porté en texte visible juste à
            // côté, dans le même lien — un `alt` non vide le dupliquerait
            // dans le nom accessible du lien.
            <img
              src={vignette}
              alt=""
              className="h-full w-full object-cover"
              style={{ filter: 'var(--imgf)' }}
            />
          ) : (
            // `miniatureReportage` renvoie `null` pour une URL non YouTube :
            // un aplat plutôt qu'un `<img src={null}>` invalide.
            <div className="h-full w-full" style={{ background: 'var(--bg3)' }} aria-hidden="true" />
          )}
          {/* Pastille de lecture décorative : masquée du nom accessible du
              lien, comme la vignette ci-dessus. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 grid place-items-center"
            style={{ background: 'oklch(0.15 0.012 45 / .32)' }}
          >
            <span
              className="relative grid h-[34px] w-[34px] place-items-center rounded-full text-[11px]"
              style={{ background: 'var(--accent)', color: 'oklch(0.15 0.012 45)' }}
            >
              ▶
              <span
                data-floaty=""
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: 'var(--accent)', animation: 'pulse 2.6s infinite' }}
              />
            </span>
          </span>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--soft)' }}>
            {t('film')}
          </p>
          <p className="font-serif text-xl" style={{ color: 'var(--ink)' }}>
            {titre}
          </p>
          {description && (
            <p className="mt-1.5 text-[13px]" style={{ color: 'var(--soft)' }}>
              {description}
            </p>
          )}
        </div>
      </Link>
    </div>
  )
}
