'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from '@/i18n/navigation'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const t = useTranslations('login')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState(false)
  const [enCours, setEnCours] = useState(false)

  async function connexion(e: React.FormEvent) {
    e.preventDefault()
    setErreur(false)
    setEnCours(true)

    const supabase = createBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    })

    if (error) {
      setErreur(true)
      setEnCours(false)
      return
    }

    router.replace('/admin')
    router.refresh()
  }

  return (
    <main className="flex-1 py-16">
      <Container className="max-w-md">
        <h1 className="mb-8 font-serif text-3xl text-brun">{t('titre')}</h1>
        <form onSubmit={connexion} className="space-y-5">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t('email')}</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-encre/20 bg-white px-4 py-3 outline-none focus:border-terracotta"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t('motDePasse')}</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full rounded-xl border border-encre/20 bg-white px-4 py-3 outline-none focus:border-terracotta"
            />
          </label>
          {erreur && (
            <p role="alert" className="text-sm font-semibold text-brun">
              {t('erreur')}
            </p>
          )}
          <Button type="submit" disabled={enCours} className="w-full">
            {enCours ? t('enCours') : t('connexion')}
          </Button>
        </form>
      </Container>
    </main>
  )
}
