'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function marquerDemandeTraitee(id: string): Promise<void> {
  const sb = await createServerClient()
  const { error } = await sb.from('demandes').update({ statut: 'traitee' }).eq('id', id)
  if (error) throw error
  revalidatePath('/[locale]/admin/demandes', 'page')
}
