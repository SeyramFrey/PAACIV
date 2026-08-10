import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { LogoutButton } from '@/components/LogoutButton'

export default async function AdminDashboard() {
  const t = await getTranslations('admin')
  const tPatrimoine = await getTranslations('adminPatrimoine')
  const tArchitectes = await getTranslations('adminArchitectes')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-brun">{t('titre')}</h1>
        <LogoutButton />
      </div>
      <p className="text-encre/80">{t('bienvenue')}</p>
      <Link href="/admin/patrimoine" className="text-brun underline">
        {tPatrimoine('titre')}
      </Link>
      <Link href="/admin/architectes" className="text-brun underline">
        {tArchitectes('titre')}
      </Link>
    </div>
  )
}
