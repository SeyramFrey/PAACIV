import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { RechercheArchitectes } from '@/components/architectes/RechercheArchitectes'
import { listeArchitectes } from '@/lib/data/architectes'

// Route sans segment dynamique ni API dynamique : sans ce flag, Next la
// prérend statiquement au build et ne la revalide jamais (les server actions
// architectes ne revalident que /admin/architectes). Cohérent avec le reste
// du site, qui est rendu par requête.
export const dynamic = 'force-dynamic'

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
    <main className="flex-1 pt-20 py-10">
      <Container className="space-y-10">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl text-ocre">{t('titre')}</h1>
          <p className="text-doux">{t('intro')}</p>
        </header>

        {/* Les deux sections passent dans un Composant Client : la recherche
            filtre les deux à la fois, il lui faut donc les deux listes. Le
            filtrage reste côté navigateur — la liste complète est déjà servie
            et tient en quelques dizaines de noms, un aller-retour serveur par
            frappe ne rendrait pas service. */}
        <RechercheArchitectes
          ivoiriens={ivoiriens}
          etrangers={etrangers}
          libelleIvoiriens={t('ivoiriens')}
          libelleEtrangers={t('etrangers')}
          libelleAucun={t('aucun')}
        />
      </Container>
    </main>
  )
}
