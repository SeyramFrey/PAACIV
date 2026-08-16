import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { CarteContenu } from '@/components/editorial/CarteContenu'
import { FiltresArticles } from '@/components/editorial/FiltresArticles'
import { listeArticles, listeCategoriesArticle } from '@/lib/data/articles'
import { champ } from '@/lib/i18n-champ'

// Route sans segment dynamique ni API dynamique : sans ce flag, Next la
// prérend statiquement au build et n'affiche jamais les articles publiés
// après le build (bug déjà rencontré côté architectes).
export const dynamic = 'force-dynamic'

function dateLocalisee(iso: string, locale: string): string {
  // `date_publication` est une colonne `date` (YYYY-MM-DD) : on force
  // `timeZone: 'UTC'` pour que le formatage ne décale pas d'un jour selon le
  // fuseau du serveur au moment du rendu.
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(iso),
  )
}

export default async function ArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('articles')
  const f = await searchParams

  const [items, categories] = await Promise.all([
    listeArticles(f.categorie),
    listeCategoriesArticle(),
  ])

  return (
    <main className="flex-1 pt-20 py-10">
      <Container className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl text-brun">{t('titre')}</h1>
          <p className="text-encre/70">{t('intro')}</p>
        </header>

        <FiltresArticles
          categories={categories}
          actif={f.categorie}
          locale={locale}
          labelToutes={t('toutes')}
        />

        {items.length === 0 ? (
          <p className="text-encre/70">{f.categorie ? t('aucunDansCategorie') : t('aucun')}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <CarteContenu
                key={a.id}
                testId="carte-article"
                href={`/articles/${a.slug}`}
                image={a.image}
                badge={a.categorie ? champ(a.categorie.nom_fr, a.categorie.nom_en, locale) : null}
                date={dateLocalisee(a.date_publication, locale)}
                titre={champ(a.titre_fr, a.titre_en, locale)}
                extrait={champ(a.chapo_fr, a.chapo_en, locale) || null}
              />
            ))}
          </div>
        )}
      </Container>
    </main>
  )
}
