import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/supabase/server'
import { FormulaireMedia } from '@/components/admin/FormulaireMedia'

export const dynamic = 'force-dynamic'

type LigneMedia = {
  emplacement: string
  chemin: string
  alt_fr: string | null
  alt_en: string | null
  credit: string | null
  licence: string | null
  licence_url: string | null
}

// Mêmes groupes que `/admin/contenu`, rangés par préfixe d'emplacement, pour
// que les deux écrans se lisent avec la même carte mentale. Un emplacement
// hors préfixe connu atterrit dans « autre » plutôt que de disparaître.
const GROUPES: readonly string[] = ['travail', 'raisons', 'parallaxe', 'journal', 'soutien']

export default async function AdminMedias() {
  const t = await getTranslations('adminMedias')
  const tg = await getTranslations('adminContenu')
  const sb = await createServerClient()
  const { data } = await sb
    .from('medias_site')
    .select('emplacement, chemin, alt_fr, alt_en, credit, licence, licence_url')
    .order('emplacement')
  const items = (data ?? []) as LigneMedia[]

  const groupes: { cle: string; lignes: LigneMedia[] }[] = GROUPES.map((g) => ({
    cle: g,
    lignes: items.filter((i) => i.emplacement === g || i.emplacement.startsWith(`${g}_`)),
  })).filter((g) => g.lignes.length > 0)

  const classees = new Set(groupes.flatMap((g) => g.lignes.map((l) => l.emplacement)))
  const autres = items.filter((i) => !classees.has(i.emplacement))
  if (autres.length > 0) groupes.push({ cle: 'autre', lignes: autres })

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="font-serif text-3xl text-ocre">{t('titre')}</h1>
        {/* L'enjeu de cet écran n'est pas de changer une photo, c'est de créditer
            celles qui sont en ligne. Le dire ici, où l'on agit. */}
        <p className="max-w-3xl text-sm text-doux">{t('intro')}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-doux">{t('aucun')}</p>
      ) : (
        groupes.map(({ cle: groupe, lignes }) => (
          <section key={groupe} className="space-y-3">
            <h2 className="text-lg font-semibold text-ocre">
              {groupe === 'autre' ? groupe : tg(`groupes.${groupe}`)}
            </h2>
            <div className="space-y-3">
              {lignes.map((l) => (
                <FormulaireMedia
                  key={l.emplacement}
                  emplacement={l.emplacement}
                  chemin={l.chemin}
                  altFr={l.alt_fr}
                  altEn={l.alt_en}
                  credit={l.credit}
                  licence={l.licence}
                  licenceUrl={l.licence_url}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
