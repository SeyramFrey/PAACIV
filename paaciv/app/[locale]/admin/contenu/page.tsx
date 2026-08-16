import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/supabase/server'
import { FormulaireContenuLigne } from '@/components/admin/FormulaireContenuLigne'

export const dynamic = 'force-dynamic'

type LigneContenu = { cle: string; valeur_fr: string | null; valeur_en: string | null }

// Ordre d'affichage des groupes : reprend l'ordre des blocs de la page
// d'accueil (spec Task 15, step 6). Une clé qui ne correspond à aucun de ces
// préfixes atterrit dans un groupe « autre » plutôt que de disparaître.
const GROUPES: readonly string[] = [
  'hero', 'association', 'travail', 'pourquoi', 'activites', 'carte', 'raisons',
  'agenda', 'parallaxe', 'archive', 'temoignages', 'journal', 'newsletter',
  'footer', 'soutien',
]

export default async function AdminContenu() {
  const t = await getTranslations('adminContenu')
  const sb = await createServerClient()
  const { data } = await sb.from('contenu_site').select('cle, valeur_fr, valeur_en').order('cle')
  const items = (data ?? []) as LigneContenu[]

  const groupes: { cle: string; lignes: LigneContenu[] }[] = GROUPES.map((g) => ({
    cle: g,
    lignes: items.filter((i) => i.cle === g || i.cle.startsWith(`${g}_`)),
  })).filter((g) => g.lignes.length > 0)

  const classees = new Set(groupes.flatMap((g) => g.lignes.map((l) => l.cle)))
  const autres = items.filter((i) => !classees.has(i.cle))
  if (autres.length > 0) groupes.push({ cle: 'autre', lignes: autres })

  return (
    <div className="space-y-10">
      <h1 className="font-serif text-3xl text-ocre">{t('titre')}</h1>

      {groupes.map(({ cle: groupe, lignes }) => (
        <section key={groupe} className="space-y-3">
          <h2 className="text-lg font-semibold text-ocre">
            {groupe === 'autre' ? groupe : t(`groupes.${groupe}`)}
          </h2>
          <div className="space-y-3">
            {lignes.map((l) => (
              // Clé stable sur `cle` seule. Une clé dérivée de la VALEUR
              // remontait le composant à chaque enregistrement réussi — la
              // revalidation renvoie la valeur qui vient d'être écrite, donc
              // la clé changeait et le témoin « Enregistré. » était porté par
              // l'instance démontée : l'admin ne le voyait jamais.
              // La resynchronisation avec une valeur changée ailleurs (autre
              // onglet, autre admin) est désormais faite DANS le composant,
              // sans remontage.
              <FormulaireContenuLigne
                key={l.cle}
                cle={l.cle}
                valeurFr={l.valeur_fr}
                valeurEn={l.valeur_en}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
