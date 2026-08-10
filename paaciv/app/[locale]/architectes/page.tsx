import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { PastilleArchitecte } from '@/components/architectes/PastilleArchitecte'
import { listeArchitectes } from '@/lib/data/architectes'

export default async function ArchitectesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('architectes')
  const tous = await listeArchitectes()

  const ivoiriens = tous
    .filter((a) => a.origine === 'ivoirien')
    .sort((x, y) => (x.annee_naissance ?? 9999) - (y.annee_naissance ?? 9999) || x.ordre - y.ordre)
  const etrangers = tous.filter((a) => a.origine === 'etranger')

  return (
    <main className="flex-1 py-10">
      <Container className="space-y-10">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl text-brun">{t('titre')}</h1>
          <p className="text-encre/70">{t('intro')}</p>
        </header>

        <section aria-label={t('ivoiriens')} className="space-y-4">
          <h2 className="font-serif text-2xl text-brun">{t('ivoiriens')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {ivoiriens.map((a) => (
              <PastilleArchitecte key={a.id} a={a} />
            ))}
          </div>
        </section>

        <section aria-label={t('etrangers')} className="space-y-4">
          <h2 className="font-serif text-2xl text-brun">{t('etrangers')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {etrangers.map((a) => (
              <PastilleArchitecte key={a.id} a={a} />
            ))}
          </div>
        </section>
      </Container>
    </main>
  )
}
