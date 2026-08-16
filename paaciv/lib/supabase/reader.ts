import { createClient } from '@supabase/supabase-js'

// Client anon SANS cookies, pour les lectures publiques (contenu publié) et
// désormais aussi les insertions publiques (demandes, newsletter — Task 7) :
// la clé anon suffit dans les deux cas, RLS fait le reste.
// Fonctionne aussi bien dans un Server Component / route handler que dans un
// test Node — contrairement à createServerClient() qui dépend de cookies().
export function createReadClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
