// Filtrage partagé du « patrimoine lié » exposé par les modules éditoriaux
// (articles, reportages). Extrait de duplication : cette fonction n'a
// aucune dépendance à « article » ou « reportage », elle est générique au
// couple (row Supabase brute -> DTO public).

export type PatrimoineLie = { slug: string; titre_fr: string; titre_en: string | null }

export type PatrimoineLieRow =
  | { slug: string; titre_fr: string; titre_en: string | null; statut: string }
  | null
  | undefined

// Le patrimoine lié n'est exposé côté public que s'il est lui-même publié.
// La RLS masque déjà la ligne côté anon, donc seul ce test unitaire prouve
// que le filtrage applicatif fait réellement son travail (c'est la leçon de
// la Phase 3 : un test d'intégration seul ne peut pas le prouver, RLS
// ferait passer le test même si ce filtre était supprimé).
export function mapPatrimoineLie(row: PatrimoineLieRow): PatrimoineLie | null {
  if (!row || row.statut !== 'publie') return null
  return { slug: row.slug, titre_fr: row.titre_fr, titre_en: row.titre_en }
}
