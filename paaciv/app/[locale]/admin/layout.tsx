import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Container } from '@/components/ui/Container'

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
    <main className="flex-1 py-10">
      <Container>{children}</Container>
    </main>
  )
}
