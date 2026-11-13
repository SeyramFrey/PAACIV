import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { CartePatrimoine } from '@/components/patrimoine/CartePatrimoine'
import { FiltresArchives } from '@/components/patrimoine/FiltresArchives'
import { FriseChrono } from '@/components/patrimoine/FriseChrono'
import { SeparateurTisse } from '@/components/ui/SeparateurTisse'
import { listePatrimoine } from '@/lib/data/patrimoine'
import { chargerReferences } from '@/lib/data/references'
import { filtreEtatOuNull } from '@/lib/etats-conservation'
import { decennieOuNull, filtrerParDecennie } from '@/lib/frise'
import { Link } from '@/i18n/navigation'

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
      // vide (cf. `filtreEtatOuNull`).
      etat: filtreEtatOuNull(f.etat) ?? undefined,
      q: f.q,
    }),
    chargerReferences(),
  ])

  // La décennie se filtre ICI, sur la liste déjà chargée : la datation d'un
  // édifice peut venir du texte libre (`anneeEdifice`), que la base ne sait
  // pas lire. La frise, elle, reçoit la liste avant ce filtre, pour garder
  // toutes ses colonnes et montrer laquelle est choisie.
  const decennieActive = decennieOuNull(f.decennie)
  const affiches = decennieActive === null ? items : filtrerParDecennie(items, decennieActive)
  const filtres: Record<string, string> = {}
  for (const cle of ['type', 'programme', 'district', 'epoque', 'etat', 'q'] as const) {
    const v = f[cle]
    if (v) filtres[cle] = v
  }

  return (
    <main className="flex-1 sous-entete pb-10">
      <Container className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl text-ocre">{t('titre')}</h1>
          <p className="text-doux">{t('intro')}</p>
        </header>

        <FiltresArchives options={options} locale={locale} />

        <p className="text-sm text-doux">
          {t('resultats', { n: affiches.length })}
          {decennieActive !== null && (
            <>
              {' · '}
              <span className="text-encre-t">{t('filtreDecennie', { d: decennieActive })}</span>{' '}
              <Link
                href={{ pathname: '/archives', query: filtres }}
                scroll={false}
                data-testid="retirer-decennie"
                className="underline hover:text-ocre"
              >
                {t('retirerDecennie')}
              </Link>
            </>
          )}
        </p>
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
              filtres={filtres}
              decennieActive={decennieActive}
              forcerDecennies={f.frise === 'decennies'}
            />
          </Container>
          <div className="my-10">
            <SeparateurTisse densite="fin" />
          </div>
        </>
      )}

      <Container>
        {affiches.length === 0 ? (
          <p className="text-doux">{t('aucun')}</p>
        ) : (
          <div data-testid="grille-patrimoine" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {affiches.map((item) => (
              <CartePatrimoine key={item.id} item={item} locale={locale} types={options.types} />
            ))}
          </div>
        )}
      </Container>
    </main>
  )
}
