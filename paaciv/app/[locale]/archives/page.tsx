import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { CartePatrimoine } from '@/components/patrimoine/CartePatrimoine'
import { FiltresArchives } from '@/components/patrimoine/FiltresArchives'
import { FriseChrono } from '@/components/patrimoine/FriseChrono'
import { SeparateurTisse } from '@/components/ui/SeparateurTisse'
import { listePatrimoine } from '@/lib/data/patrimoine'
import { chargerReferences } from '@/lib/data/references'
import { etatOuNull } from '@/lib/etats-conservation'

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
      // Un `?etat=` fantaisiste est ignoré plutôt que de filtrer sur une
      // catégorie inexistante — l'archive reste complète au lieu de paraître
      // vide (cf. `etatOuNull`).
      etat: etatOuNull(f.etat) ?? undefined,
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
      </Container>

      {/* La frise porte sur le RÉSULTAT FILTRÉ, pas sur le corpus entier : elle
          doit répondre à la question que le visiteur vient de poser. Filtrer sur
          « édifices religieux » et voir la chronologie de tout le corpus serait
          une réponse à côté. */}
      {items.length > 0 && (
        <>
          <div className="my-10">
            <SeparateurTisse densite="fin" />
          </div>
          <Container>
            <FriseChrono
              items={items}
              epoques={options.epoques}
              types={options.types}
              locale={locale}
            />
          </Container>
          <div className="my-10">
            <SeparateurTisse densite="fin" />
          </div>
        </>
      )}

      <Container>
        {items.length === 0 ? (
          <p className="text-doux">{t('aucun')}</p>
        ) : (
          <div data-testid="grille-patrimoine" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <CartePatrimoine key={item.id} item={item} locale={locale} types={options.types} />
            ))}
          </div>
        )}
      </Container>
    </main>
  )
}
