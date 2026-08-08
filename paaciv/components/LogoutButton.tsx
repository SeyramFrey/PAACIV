'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'

export function LogoutButton() {
  const t = useTranslations('admin')
  const router = useRouter()
  const [enCours, setEnCours] = useState(false)

  async function deconnexion() {
    setEnCours(true)
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <Button variant="ghost" onClick={deconnexion} disabled={enCours}>
      {t('deconnexion')}
    </Button>
  )
}
