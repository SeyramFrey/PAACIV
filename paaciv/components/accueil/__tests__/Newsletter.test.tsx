import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { Newsletter } from '@/components/accueil/Newsletter'

const inscrire = vi.hoisted(() => vi.fn())
vi.mock('@/app/[locale]/actions/newsletter', () => ({ inscrireNewsletter: inscrire }))

function monter() {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <Newsletter titre="Recevoir nos relevés" texte="Une lettre par mois." />
    </NextIntlClientProvider>,
  )
}

beforeEach(() => inscrire.mockReset())

describe('Newsletter', () => {
  it('affiche la confirmation après un succès', async () => {
    inscrire.mockResolvedValue({ ok: true })
    monter()
    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'a@b.ci')
    await userEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))
    expect(await screen.findByRole('status')).toHaveTextContent(/merci/i)
  })

  it('affiche l’erreur renvoyée par l’action', async () => {
    inscrire.mockResolvedValue({ ok: false, erreur: 'emailInvalide' })
    monter()
    // 'a@b' plutôt que 'x' (fixture du brief) : le champ est `type="email"
    // required` (structure imposée par le Step 7). Sous jsdom comme dans un
    // vrai navigateur, 'x' échoue la validation HTML5 native et bloque la
    // soumission avant même que l'action ne soit appelée — vérifié
    // empiriquement (`onSubmit` jamais déclenché). C'est exactement le
    // conflit déjà résolu pour FormulaireSoutien (Task 8, ruling consigné
    // dans progress.md) : on garde la validation native intacte plutôt que
    // de la désactiver via `noValidate`, et on choisit une saisie qui passe
    // le navigateur mais échoue `RE_EMAIL` côté serveur — 'a@b' est déjà la
    // valeur retenue là-bas.
    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'a@b')
    await userEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
