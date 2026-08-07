import { createServerClient as create } from '@supabase/ssr'
import { cookies } from 'next/headers'

// NOTE : `@supabase/ssr` (>= 0.11) attend des méthodes de cookies `getAll` /
// `setAll` (et non plus l'ancien trio `get` / `set` / `remove`, aujourd'hui
// dépréciées). `cookies()` de `next/headers` est asynchrone depuis Next.js 15,
// donc cette fabrique l'est aussi.
export async function createServerClient() {
  const cookieStore = await cookies()

  return create(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // `setAll` a été appelée depuis un Server Component : les cookies
            // ne peuvent pas y être modifiés. Sans effet si un middleware se
            // charge par ailleurs de rafraîchir la session utilisateur.
          }
        },
      },
    }
  )
}
