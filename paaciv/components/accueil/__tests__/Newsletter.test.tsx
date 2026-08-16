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
  it('affiche la confirmation après un succès, avec la bonne adresse transmise', async () => {
    inscrire.mockResolvedValue({ ok: true })
    monter()
    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'a@b.ci')
    await userEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))
    expect(await screen.findByRole('status')).toHaveTextContent(/merci/i)
    // Verrou du câblage : un `name="email"` erroné (faute de frappe, champ
    // renommé) laisserait ce test vert quand même si on ne vérifiait que le
    // message affiché — l'action recevrait un FormData sans la valeur saisie
    // et casserait la production en silence.
    expect(inscrire.mock.calls[0][0].get('email')).toBe('a@b.ci')
  })

  it('affiche l’erreur renvoyée par l’action', async () => {
    inscrire.mockResolvedValue({ ok: false, erreur: 'emailInvalide' })
    monter()
    // 'a@b' plutôt que 'x' (fixture du brief) : le champ est `type="email"
    // required` (structure imposée par le Step 7). Sous jsdom comme dans un
    // vrai navigateur, 'x' échoue la validation HTML5 native et bloque la
    // soumission avant même que l'action ne soit appelée — vérifié
    // empiriquement (`onSubmit` jamais déclenché). 'a@b' passe cette
    // validation native (présence d'un `@` avec des segments non vides).
    // Note : contrairement à `FormulaireSoutien` (Task 8), où 'a@b' exerçait
    // le vrai `RE_EMAIL` côté serveur, l'action est ici MOCKÉE — `RE_EMAIL`
    // n'est jamais atteint, seule la validation HTML5 native du navigateur
    // (celle de jsdom) est en jeu. 'a@b' n'est retenu que pour cette raison,
    // pas pour reproduire un chemin serveur.
    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'a@b')
    await userEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
