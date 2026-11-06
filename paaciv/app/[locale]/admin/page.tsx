import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { GROUPES_RUBRIQUES } from '@/lib/admin/rubriques'

export default async function AdminDashboard() {
  const t = await getTranslations()

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-serif text-3xl text-ocre">{t('admin.titre')}</h1>
        <p className="text-doux">{t('admin.bienvenue')}</p>
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        {GROUPES_RUBRIQUES.map((groupe) => (
          <section key={groupe.cle}>
            <h2 className="font-serif text-xl text-encre-t">{t(`admin.groupes.${groupe.cle}`)}</h2>
            <ul className="mt-2 space-y-1">
              {groupe.rubriques.map((rubrique) => (
                <li key={rubrique.href}>
                  <Link href={rubrique.href} className="text-ocre underline">
                    {t(`${rubrique.espace}.titre`)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
