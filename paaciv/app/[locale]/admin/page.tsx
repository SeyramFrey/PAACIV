import { getTranslations } from 'next-intl/server'
import { LogoutButton } from '@/components/LogoutButton'

export default async function AdminDashboard() {
  const t = await getTranslations('admin')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-brun">{t('titre')}</h1>
        <LogoutButton />
      </div>
      <p className="text-encre/80">{t('bienvenue')}</p>
    </div>
  )
}
