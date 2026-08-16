import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { Link } from '@/i18n/navigation'
import { TexteRiche } from '@/components/patrimoine/TexteRiche'
import { FacadeVideo } from '@/components/editorial/FacadeVideo'
import { getReportageParSlugCache as getReportage, miniatureReportage } from '@/lib/data/reportages'
import { champ } from '@/lib/i18n-champ'

// Segment dynamique ([slug]) : cette page est déjà `ƒ` par construction
// (aucune donnée dynamique en dehors du paramètre de route). Export explicite
// pour que l'invariant reste local plutôt qu'implicite : il court-circuiterait
// silencieusement si `generateStaticParams` était ajouté un jour.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const r = await getReportage(slug)
  if (!r) return {}
  const titre = champ(r.titre_fr, r.titre_en, locale)
  const description = champ(r.description_fr, r.description_en, locale).replace(/<[^>]+>/g, '')
  const miniature = miniatureReportage(r.video_url)
  return {
    title: `${titre} — PAACIV`,
    description,
    openGraph: {
      title: titre,
      description,
      images: miniature ? [miniature] : [],
      type: 'video.other',
    },
  }
}

function dateLocalisee(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(iso),
  )
}

export default async function FicheReportage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('ficheReportage')
  const tVideo = await getTranslations('video')
  const r = await getReportage(slug)
  if (!r) notFound()

  const titre = champ(r.titre_fr, r.titre_en, locale)
  const description = champ(r.description_fr, r.description_en, locale)

  return (
    <main className="flex-1 pt-20 py-10">
      <Container className="mx-auto max-w-3xl space-y-6">
        <Link href="/reportages" className="text-sm text-ocre underline">
          {t('retour')}
        </Link>

        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-doux">
            <span>{dateLocalisee(r.date, locale)}</span>
          </div>
          <h1 className="font-serif text-4xl text-ocre">{titre}</h1>
        </header>

        <FacadeVideo url={r.video_url} titre={titre} labelLire={tVideo('lire')} />

        <TexteRiche html={description} />

        {r.patrimoine && (
          <section data-testid="patrimoine-lie" className="rounded-2xl border border-filet p-4">
            <h2 className="mb-2 font-serif text-lg text-ocre">{t('patrimoineLie')}</h2>
            <Link href={`/patrimoine/${r.patrimoine.slug}`} className="text-ocre underline">
              {champ(r.patrimoine.titre_fr, r.patrimoine.titre_en, locale)}
            </Link>
          </section>
        )}
      </Container>
    </main>
  )
}
