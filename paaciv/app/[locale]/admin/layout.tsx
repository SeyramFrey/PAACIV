import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Container } from '@/components/ui/Container'
import { BanniereEnregistre } from '@/components/admin/BanniereEnregistre'
import { NavigationAdmin } from '@/components/admin/NavigationAdmin'

// Garde de session : rendue côté serveur avant tout contenu admin. Sans
// utilisateur authentifié, on redirige vers la page de connexion localisée.
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  return (
    <div className="sous-entete-ras flex-1 lg:flex">
      <NavigationAdmin />
      <main className="min-w-0 flex-1 overflow-x-auto pb-10 pt-8 lg:pt-10">
        <Container>
          {/* Monté dans le gabarit, et non dans chaque écran : l'enregistrement
              s'achève par une navigation, dont la destination varie selon le
              formulaire (liste, fiche créée, page courante). Ici, le témoin
              atteint toutes ces destinations sans les toucher une à une.
              `Suspense` est exigé par `useSearchParams` sous Next : sans lui,
              le build bascule toute la branche admin en rendu client. */}
          <Suspense fallback={null}>
            <BanniereEnregistre />
          </Suspense>
          {children}
        </Container>
      </main>
    </div>
  )
}
