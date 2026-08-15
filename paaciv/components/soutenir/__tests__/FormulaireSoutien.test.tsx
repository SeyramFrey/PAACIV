import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { FormulaireSoutien } from '@/components/soutenir/FormulaireSoutien'

const deposer = vi.hoisted(() => vi.fn())
vi.mock('@/app/[locale]/actions/soutien', () => ({ deposerDemande: deposer }))

function monter(type: 'adhesion' | 'don' | 'archive' = 'don') {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <FormulaireSoutien type={type} paiement="Wave 07 00 00 00 00" onSucces={() => {}} />
    </NextIntlClientProvider>,
  )
}

beforeEach(() => deposer.mockReset())

describe('FormulaireSoutien', () => {
  it('affiche un champ montant pour un don, pas pour une archive', () => {
    const { unmount } = monter('don')
    expect(screen.getByLabelText(/montant/i)).toBeInTheDocument()
    unmount()
    monter('archive')
    expect(screen.queryByLabelText(/montant/i)).not.toBeInTheDocument()
  })

  it('affiche le message d’erreur renvoyé par l’action', async () => {
    deposer.mockResolvedValue({ ok: false, erreur: 'emailInvalide' })
    monter('don')
    await userEvent.type(screen.getByLabelText(/nom/i), 'Test')
    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'x')
    await userEvent.click(screen.getByRole('button', { name: /envoyer/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/adresse/i)
  })

  it('affiche la confirmation et les moyens de paiement après succès', async () => {
    deposer.mockResolvedValue({ ok: true })
    monter('don')
    await userEvent.type(screen.getByLabelText(/nom/i), 'Test')
    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'a@b.ci')
    await userEvent.click(screen.getByRole('button', { name: /envoyer/i }))
    expect(await screen.findByText(/Wave 07 00 00 00 00/)).toBeInTheDocument()
  })
})
