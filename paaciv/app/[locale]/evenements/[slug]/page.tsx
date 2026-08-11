import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { Link } from '@/i18n/navigation'
import { TexteRiche } from '@/components/patrimoine/TexteRiche'
import { getEvenementParSlugCache as getEvenement } from '@/lib/data/evenements'
import { champ } from '@/lib/i18n-champ'

// Segment dynamique ([slug]) : cette page est déjà `ƒ` par construction
// (aucune donnée dynamique en dehors du paramètre de route). Export explicite
// pour que l'invariant reste local plutôt qu'implicite : il court-circuiterait
// silencieusement si `generateStaticParams` était ajouté un jour.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const e = await getEvenement(slug)
  if (!e) return {}
  const titre = champ(e.titre_fr, e.titre_en, locale)
  const description = champ(e.description_fr, e.description_en, locale).replace(/<[^>]+>/g, '')
  return {
    title: `${titre} — PAACIV`,
    description,
    openGraph: {
      title: titre,
      description,
      images: e.image ? [e.image] : [],
      type: 'article',
    },
  }
}

function dateLocalisee(dateDebut: string, dateFin: string | null, locale: string): string {
  // Colonnes `date` (YYYY-MM-DD) : `timeZone: 'UTC'` évite un décalage d'un
  // jour selon le fuseau du serveur au moment du rendu.
  const formateur = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' })
  const debut = formateur.format(new Date(dateDebut))
  if (!dateFin || dateFin === dateDebut) return debut
  return `${debut} – ${formateur.format(new Date(dateFin))}`
}

export default async function FicheEvenement({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('ficheEvenement')
  const e = await getEvenement(slug)
  if (!e) notFound()

  const titre = champ(e.titre_fr, e.titre_en, locale)
  const description = champ(e.description_fr, e.description_en, locale)

  return (
    <main className="flex-1 py-10">
      <Container className="mx-auto max-w-3xl space-y-6">
        <Link href="/evenements" className="text-sm text-brun underline">
          {t('retour')}
        </Link>

        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-encre/50">
            <span data-testid="evenement-dates">{dateLocalisee(e.date_debut, e.date_fin, locale)}</span>
            {e.lieu && (
              <span>
                {t('lieu')} : {e.lieu}
              </span>
            )}
          </div>
          <h1 className="font-serif text-4xl text-brun">{titre}</h1>
        </header>

        {e.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.image} alt={titre} className="w-full rounded-2xl object-cover" />
        )}

        <TexteRiche html={description} />
      </Container>
    </main>
  )
}
