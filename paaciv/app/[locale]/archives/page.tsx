import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { CartePatrimoine } from '@/components/patrimoine/CartePatrimoine'
import { FiltresArchives } from '@/components/patrimoine/FiltresArchives'
import { listePatrimoine } from '@/lib/data/patrimoine'
import { chargerReferences } from '@/lib/data/references'

export default async function ArchivesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const f = await searchParams
  const t = await getTranslations('archives')

  const [items, options] = await Promise.all([
    listePatrimoine({
      type: f.type,
      programme: f.programme,
      district: f.district,
      epoque: f.epoque,
      q: f.q,
    }),
    chargerReferences(),
  ])

  return (
    <main className="flex-1 pt-20 py-10">
      <Container className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl text-ocre">{t('titre')}</h1>
          <p className="text-doux">{t('intro')}</p>
        </header>

        <FiltresArchives options={options} locale={locale} />

        <p className="text-sm text-doux">{t('resultats', { n: items.length })}</p>

        {items.length === 0 ? (
          <p className="text-doux">{t('aucun')}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <CartePatrimoine key={item.id} item={item} locale={locale} />
            ))}
          </div>
        )}
      </Container>
    </main>
  )
}
