import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { Modal } from '@/components/ui/Modal'

// jsdom n'implémente pas l'API <dialog> : on la stubbe pour que le composant
// puisse être monté et que le contrat (titre, bouton, rappel) soit vérifié.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true }
  HTMLDialogElement.prototype.close = function () { this.open = false }
})

// `Modal` appelle `useTranslations('modal')` : sans `NextIntlClientProvider`,
// le hook lève (même convention que `FiltresCarte.test.tsx` et
// `CarteContenu.test.tsx`).
function renderAvecProvider(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="fr" messages={{ modal: { fermer: 'Fermer' } }}>
      {ui}
    </NextIntlClientProvider>,
  )
}

describe('Modal', () => {
  it('ne rend rien de visible quand il est fermé', () => {
    renderAvecProvider(<Modal ouvert={false} onFermer={() => {}} titre="Adhérer">contenu</Modal>)
    expect(screen.queryByText('contenu')).not.toBeVisible()
  })

  it('affiche le titre et le contenu quand il est ouvert', () => {
    renderAvecProvider(<Modal ouvert onFermer={() => {}} titre="Adhérer">contenu</Modal>)
    expect(screen.getByRole('heading', { name: 'Adhérer' })).toBeInTheDocument()
    expect(screen.getByText('contenu')).toBeInTheDocument()
  })

  it('appelle onFermer au clic sur le bouton de fermeture', async () => {
    const onFermer = vi.fn()
    renderAvecProvider(<Modal ouvert onFermer={onFermer} titre="Adhérer">contenu</Modal>)
    await userEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onFermer).toHaveBeenCalledOnce()
  })

  it("Échap appelle onFermer et empêche le DOM de se refermer dans le dos de React", () => {
    const onFermer = vi.fn()
    const { container } = renderAvecProvider(<Modal ouvert onFermer={onFermer} titre="Adhérer">contenu</Modal>)
    const dialog = container.querySelector('dialog') as HTMLDialogElement
    const evenement = new Event('cancel', { cancelable: true })
    dialog.dispatchEvent(evenement)
    expect(onFermer).toHaveBeenCalledOnce()
    // Le point qui compte vraiment : sans `preventDefault`, le DOM se
    // fermerait tout seul alors que `ouvert` resterait à true côté React —
    // ce désaccord rendrait la modale impossible à rouvrir.
    expect(evenement.defaultPrevented).toBe(true)
  })

  it('un clic sur le fond (la cible est le dialog lui-même) appelle onFermer', () => {
    const onFermer = vi.fn()
    const { container } = renderAvecProvider(<Modal ouvert onFermer={onFermer} titre="Adhérer">contenu</Modal>)
    const dialog = container.querySelector('dialog') as HTMLDialogElement
    fireEvent.click(dialog)
    expect(onFermer).toHaveBeenCalledOnce()
  })

  it("un clic à l'intérieur (sur l'étiquette d'un champ) n'appelle pas onFermer", async () => {
    const onFermer = vi.fn()
    renderAvecProvider(
      <Modal ouvert onFermer={onFermer} titre="Adhérer">
        <label htmlFor="champ-test">Nom</label>
        <input id="champ-test" />
      </Modal>,
    )
    await userEvent.click(screen.getByText('Nom'))
    expect(onFermer).not.toHaveBeenCalled()
  })
})
