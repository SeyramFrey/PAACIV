import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { CarteContenu } from '@/components/editorial/CarteContenu'
import { listeEvenements } from '@/lib/data/evenements'
import { partitionnerEvenements } from '@/lib/evenements-dates'
import { champ } from '@/lib/i18n-champ'

// Route sans segment dynamique ni API dynamique, ET dont le rendu dépend de
// `new Date()` (partition à venir/passés) : sans ce flag, Next la prérend
// statiquement au build et un événement passé resterait annoncé « à venir »
// indéfiniment (bug déjà rencontré côté architectes).
export const dynamic = 'force-dynamic'

function dateLocalisee(dateDebut: string, dateFin: string | null, locale: string): string {
  // Colonnes `date` (YYYY-MM-DD) : `timeZone: 'UTC'` évite un décalage d'un
  // jour selon le fuseau du serveur au moment du rendu.
  const formateur = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' })
  const debut = formateur.format(new Date(dateDebut))
  if (!dateFin || dateFin === dateDebut) return debut
  return `${debut} – ${formateur.format(new Date(dateFin))}`
}

export default async function EvenementsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('evenements')

  const items = await listeEvenements()
  const { aVenir, passes } = partitionnerEvenements(items, new Date())

  return (
    <main className="flex-1 pt-20 py-10">
      <Container className="space-y-10">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl text-brun">{t('titre')}</h1>
          <p className="text-encre/70">{t('intro')}</p>
        </header>

        <section aria-label={t('aVenir')} className="space-y-4">
          <h2 className="font-serif text-2xl text-brun">{t('aVenir')}</h2>
          {aVenir.length === 0 ? (
            <p className="text-encre/70">{t('aucunAVenir')}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {aVenir.map((e) => (
                <CarteContenu
                  key={e.id}
                  testId="carte-evenement"
                  href={`/evenements/${e.slug}`}
                  image={e.image}
                  date={dateLocalisee(e.date_debut, e.date_fin, locale)}
                  titre={champ(e.titre_fr, e.titre_en, locale)}
                />
              ))}
            </div>
          )}
        </section>

        <section aria-label={t('passes')} className="space-y-4">
          <h2 className="font-serif text-2xl text-brun">{t('passes')}</h2>
          {passes.length === 0 ? (
            <p className="text-encre/70">{t('aucunPasse')}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {passes.map((e) => (
                <CarteContenu
                  key={e.id}
                  testId="carte-evenement"
                  href={`/evenements/${e.slug}`}
                  image={e.image}
                  date={dateLocalisee(e.date_debut, e.date_fin, locale)}
                  titre={champ(e.titre_fr, e.titre_en, locale)}
                />
              ))}
            </div>
          )}
        </section>
      </Container>
    </main>
  )
}
