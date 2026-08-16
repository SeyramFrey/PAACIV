import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { Link } from '@/i18n/navigation'
import { TexteRiche } from '@/components/patrimoine/TexteRiche'
import { getArticleParSlugCache as getArticle } from '@/lib/data/articles'
import { champ } from '@/lib/i18n-champ'

// Segment dynamique ([slug]) : cette page est déjà `ƒ` par construction
// (aucune donnée dynamique en dehors du paramètre de route). Export explicite
// pour que l'invariant reste local plutôt qu'implicite : il court-circuiterait
// silencieusement si `generateStaticParams` était ajouté un jour.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const a = await getArticle(slug)
  if (!a) return {}
  const titre = champ(a.titre_fr, a.titre_en, locale)
  const description = champ(a.chapo_fr, a.chapo_en, locale).replace(/<[^>]+>/g, '')
  return {
    title: `${titre} — PAACIV`,
    description,
    openGraph: {
      title: titre,
      description,
      images: a.image ? [a.image] : [],
      type: 'article',
    },
  }
}

function dateLocalisee(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(iso),
  )
}

export default async function FicheArticle({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('ficheArticle')
  const a = await getArticle(slug)
  if (!a) notFound()

  const titre = champ(a.titre_fr, a.titre_en, locale)
  const chapo = champ(a.chapo_fr, a.chapo_en, locale)
  const corps = champ(a.corps_fr, a.corps_en, locale)
  const categorie = a.categorie ? champ(a.categorie.nom_fr, a.categorie.nom_en, locale) : null

  return (
    <main className="flex-1 pt-20 py-10">
      <Container className="mx-auto max-w-3xl space-y-6">
        <Link href="/articles" className="text-sm text-ocre underline">
          {t('retour')}
        </Link>

        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-doux">
            {categorie && <span>{categorie}</span>}
            <span>{dateLocalisee(a.date_publication, locale)}</span>
          </div>
          <h1 className="font-serif text-4xl text-ocre">{titre}</h1>
          {chapo && <p className="text-lg text-doux">{chapo}</p>}
        </header>

        {a.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.image} alt={titre} className="w-full rounded-2xl object-cover" />
        )}

        <TexteRiche html={corps} />

        {a.patrimoine && (
          <section data-testid="patrimoine-lie" className="rounded-2xl border border-filet p-4">
            <h2 className="mb-2 font-serif text-lg text-ocre">{t('patrimoineLie')}</h2>
            <Link href={`/patrimoine/${a.patrimoine.slug}`} className="text-ocre underline">
              {champ(a.patrimoine.titre_fr, a.patrimoine.titre_en, locale)}
            </Link>
          </section>
        )}
      </Container>
    </main>
  )
}
