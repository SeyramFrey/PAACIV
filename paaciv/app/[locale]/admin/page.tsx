import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { LogoutButton } from '@/components/LogoutButton'

export default async function AdminDashboard() {
  const t = await getTranslations('admin')
  const tPatrimoine = await getTranslations('adminPatrimoine')
  const tArchitectes = await getTranslations('adminArchitectes')
  const tArticles = await getTranslations('adminArticles')
  const tReportages = await getTranslations('adminReportages')
  const tEvenements = await getTranslations('adminEvenements')
  const tContenu = await getTranslations('adminContenu')
  const tPointsCles = await getTranslations('adminPointsCles')
  const tActivites = await getTranslations('adminActivites')
  const tTemoignages = await getTranslations('adminTemoignages')
  const tAbonnes = await getTranslations('adminAbonnes')
  const tDemandes = await getTranslations('adminDemandes')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-brun">{t('titre')}</h1>
        <LogoutButton />
      </div>
      <p className="text-encre/80">{t('bienvenue')}</p>
      <div className="flex flex-col gap-2">
        <Link href="/admin/patrimoine" className="text-brun underline">
          {tPatrimoine('titre')}
        </Link>
        <Link href="/admin/architectes" className="text-brun underline">
          {tArchitectes('titre')}
        </Link>
        <Link href="/admin/articles" className="text-brun underline">
          {tArticles('titre')}
        </Link>
        <Link href="/admin/reportages" className="text-brun underline">
          {tReportages('titre')}
        </Link>
        <Link href="/admin/evenements" className="text-brun underline">
          {tEvenements('titre')}
        </Link>
        <Link href="/admin/contenu" className="text-brun underline">
          {tContenu('titre')}
        </Link>
        <Link href="/admin/points-cles" className="text-brun underline">
          {tPointsCles('titre')}
        </Link>
        <Link href="/admin/activites" className="text-brun underline">
          {tActivites('titre')}
        </Link>
        <Link href="/admin/temoignages" className="text-brun underline">
          {tTemoignages('titre')}
        </Link>
        <Link href="/admin/abonnes" className="text-brun underline">
          {tAbonnes('titre')}
        </Link>
        <Link href="/admin/demandes" className="text-brun underline">
          {tDemandes('titre')}
        </Link>
      </div>
    </div>
  )
}
