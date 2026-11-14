import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Un reportage publié, lié à La Pyramide, le temps d'un fichier de tests.
//
// Les reportages de démo du seed (`visite-basilique`, `survol-hotel-ivoire`)
// ont été dépubliés le 15/11/2026, quand la vraie vidéo de la chaîne PAACIV a
// été branchée (décision de Sey). Les tests qui ont besoin d'un reportage lié
// à une fiche créent donc le leur, puis l'effacent.
//
// - Session administrateur, jamais de clé de service (mêmes droits RLS que le
//   back-office).
// - Date en 2000 : le reportage de test ne passe jamais devant la vraie vidéo
//   dans la carte « Film » de l'accueil, qui montre le plus récent.
// - Préfixe de slug propre à chaque fichier : les fichiers tournent en
//   parallèle sans se marcher dessus.
export const PREFIXE_REPORTAGE_LIE = 'test-reportage-lie-e2e'

async function connexionAdmin(): Promise<SupabaseClient> {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error } = await db.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  if (error) throw error
  return db
}

export type ReportageLie = { slug: string; titre: string; supprimer: () => Promise<void> }

export async function creerReportageLie(suffixe: string): Promise<ReportageLie> {
  const db = await connexionAdmin()
  const slug = `${PREFIXE_REPORTAGE_LIE}-${suffixe}`
  const titre = `Reportage de test lié (${suffixe})`
  const { data: fiche, error: e1 } = await db
    .from('patrimoine')
    .select('id')
    .eq('slug', 'la-pyramide-abidjan')
    .single()
  if (e1) throw e1
  // Un reste d'une exécution interrompue bloquerait l'insertion (slug unique).
  await db.from('reportages').delete().eq('slug', slug)
  const { error: e2 } = await db.from('reportages').insert({
    slug,
    titre_fr: titre,
    video_url: 'https://www.youtube.com/watch?v=TcKdp_Pu988',
    date: '2000-01-01',
    statut: 'publie',
    patrimoine_id: fiche.id,
  })
  if (e2) throw e2
  return {
    slug,
    titre,
    supprimer: async () => {
      const { error } = await db.from('reportages').delete().eq('slug', slug)
      if (error) throw error
    },
  }
}
