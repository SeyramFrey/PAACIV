import { notFound } from 'next/navigation'
import { FormulaireArchitecte, type ArchitecteAdmin } from '@/components/admin/FormulaireArchitecte'
import type { BlocsSaisis } from '@/components/admin/BlocsArchitecte'
import { grouperBlocs, type BlocArchitecte } from '@/lib/data/architectes'
import { createServerClient } from '@/lib/supabase/server'

export default async function EditerArchitecte({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params
  const sb = await createServerClient()
  const { data: a } = await sb.from('architectes').select('*').eq('id', id).maybeSingle()
  if (!a) notFound()

  // Les blocs vivent dans leur propre table : `select('*')` ci-dessus ne les
  // rapporte pas. Requête séparée plutôt qu'une jointure imbriquée — le
  // formulaire les veut à plat, groupés par type, exactement comme le rendu
  // public, d'où la réutilisation de `grouperBlocs`.
  const { data: lignes } = await sb
    .from('architecte_blocs')
    .select('id, bloc, surtitre_fr, surtitre_en, titre_fr, titre_en, texte_fr, texte_en, ordre')
    .eq('architecte_id', id)
  const groupes = grouperBlocs((lignes ?? []) as BlocArchitecte[])

  // Le formulaire saisit des chaînes, jamais `null` : un `value={null}` sur un
  // <input> contrôlé le ferait basculer en non-contrôlé et React s'en plaint.
  const blocs = Object.fromEntries(
    Object.entries(groupes).map(([type, liste]) => [
      type,
      liste.map((b) => ({
        surtitre_fr: b.surtitre_fr ?? '',
        surtitre_en: b.surtitre_en ?? '',
        titre_fr: b.titre_fr ?? '',
        titre_en: b.titre_en ?? '',
        texte_fr: b.texte_fr ?? '',
        texte_en: b.texte_en ?? '',
      })),
    ]),
  ) as BlocsSaisis

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ocre">{(a as ArchitecteAdmin).nom}</h1>
      <FormulaireArchitecte initial={a as ArchitecteAdmin} blocs={blocs} />
    </div>
  )
}
