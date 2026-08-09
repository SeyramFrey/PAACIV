'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function supprimerPatrimoine(id: string) {
  const sb = await createServerClient()
  const { error } = await sb.from('patrimoine').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/[locale]/admin/patrimoine', 'page')
}
