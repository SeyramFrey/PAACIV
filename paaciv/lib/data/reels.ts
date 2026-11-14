import { createReadClient } from '@/lib/supabase/reader'

export type Reel = {
  id: string
  video: string
  affiche: string | null
  lien: string
  legende_fr: string | null
  legende_en: string | null
  credit: string | null
  date_publication: string | null
}

// Au-delà, la roue n'en montre de toute façon que sept à la fois.
const MAXIMUM = 12

// La table `reels` vient de la migration 0037. Tant qu'elle n'est pas
// appliquée sur une base, l'accueil doit rester debout : seule l'absence de
// la table est tolérée, toute autre erreur remonte.
const TABLE_ABSENTE = new Set(['42P01', 'PGRST205'])

export async function listeReels(): Promise<Reel[]> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('reels')
    .select('id, video, affiche, lien, legende_fr, legende_en, credit, date_publication')
    .eq('statut', 'publie')
    .order('ordre', { ascending: true })
    .order('date_publication', { ascending: false, nullsFirst: false })
    .limit(MAXIMUM)
  if (error) {
    if (error.code && TABLE_ABSENTE.has(error.code)) return []
    throw error
  }
  return (data ?? []) as Reel[]
}
