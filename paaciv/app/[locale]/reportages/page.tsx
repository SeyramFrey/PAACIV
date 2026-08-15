import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { CarteContenu } from '@/components/editorial/CarteContenu'
import { listeReportages, miniatureReportage } from '@/lib/data/reportages'
import { champ } from '@/lib/i18n-champ'

// Route sans segment dynamique ni API dynamique : sans ce flag, Next la
// prérend statiquement au build et n'affiche jamais les reportages publiés
// après le build (bug déjà rencontré côté architectes).
export const dynamic = 'force-dynamic'

function dateLocalisee(iso: string, locale: string): string {
  // `date` est une colonne `date` (YYYY-MM-DD) : on force `timeZone: 'UTC'`
  // pour que le formatage ne décale pas d'un jour selon le fuseau du
  // serveur au moment du rendu.
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(iso),
  )
}

export default async function ReportagesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('reportages')

  const items = await listeReportages()

  return (
    <main className="flex-1 pt-20 py-10">
      <Container className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl text-brun">{t('titre')}</h1>
          <p className="text-encre/70">{t('intro')}</p>
        </header>

        {items.length === 0 ? (
          <p className="text-encre/70">{t('aucun')}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <CarteContenu
                key={r.id}
                testId="carte-reportage"
                href={`/reportages/${r.slug}`}
                image={miniatureReportage(r.video_url)}
                date={dateLocalisee(r.date, locale)}
                titre={champ(r.titre_fr, r.titre_en, locale)}
                badgeLecture
              />
            ))}
          </div>
        )}
      </Container>
    </main>
  )
}
