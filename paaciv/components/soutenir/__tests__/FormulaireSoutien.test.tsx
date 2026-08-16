import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { FormulaireSoutien } from '@/components/soutenir/FormulaireSoutien'

const deposer = vi.hoisted(() => vi.fn())
vi.mock('@/app/[locale]/actions/soutien', () => ({ deposerDemande: deposer }))

function monter(type: 'adhesion' | 'don' | 'archive' = 'don', paiement = 'Wave 07 00 00 00 00') {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <FormulaireSoutien type={type} paiement={paiement} onSucces={() => {}} />
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
    // 'a@b' passe la validation HTML5 native (pas de point de domaine exigé)
    // mais échoue RE_EMAIL côté serveur (Task 7) : même aller-retour que
    // 'x', sans dépendre d'une désactivation de la validation native.
    await userEvent.type(screen.getByLabelText(/nom/i), 'Test')
    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'a@b')
    await userEvent.click(screen.getByRole('button', { name: /envoyer/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/adresse/i)
    // La saisie doit survivre à une erreur : un formulaire vidé forcerait le
    // donateur à tout retaper, y compris un message d'archive détaillé.
    expect(screen.getByLabelText(/nom/i)).toHaveValue('Test')
    // Verrou du câblage : si `formData.set('type', type)` disparaissait,
    // chaque soumission reviendrait `typeInvalide` en silence côté tests.
    expect(deposer.mock.calls[0][0].get('type')).toBe('don')
  })

  it('affiche la confirmation et les moyens de paiement après succès', async () => {
    deposer.mockResolvedValue({ ok: true })
    monter('don')
    await userEvent.type(screen.getByLabelText(/nom/i), 'Test')
    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'a@b.ci')
    await userEvent.click(screen.getByRole('button', { name: /envoyer/i }))
    expect(await screen.findByText(/Wave 07 00 00 00 00/)).toBeInTheDocument()
  })

  it('masque le bloc « Pour finaliser » tant que le moyen de paiement n’est pas renseigné', async () => {
    // Agnostique au type : l'adhésion et l'archive passent par le même
    // écran de confirmation que le don, avec le même risque de fuite du
    // marqueur « À COMPLÉTER » tant que l'association ne l'a pas remplacé.
    deposer.mockResolvedValue({ ok: true })
    monter('adhesion', 'À COMPLÉTER — coordonnées bancaires, Wave, Orange Money')
    await userEvent.type(screen.getByLabelText(/nom/i), 'Test')
    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'a@b.ci')
    await userEvent.click(screen.getByRole('button', { name: /envoyer/i }))
    expect(await screen.findByText(/merci/i)).toBeInTheDocument()
    expect(screen.queryByText(/À COMPLÉTER/)).not.toBeInTheDocument()
    expect(screen.queryByText(/pour finaliser/i)).not.toBeInTheDocument()
  })
})
