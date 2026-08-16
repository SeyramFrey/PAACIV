import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { GrilleArchive } from '@/components/accueil/GrilleArchive'
import type { VignetteArchive } from '@/lib/data/accueil'
import type { Ref } from '@/lib/data/patrimoine'

const TYPES: Ref[] = [
  { id: 'religieux', nom_fr: 'Religieux', nom_en: null, couleur: '#B5581F', ordre: 1 },
  { id: 'civil', nom_fr: 'Civil', nom_en: null, couleur: '#46603F', ordre: 2 },
]

const V: VignetteArchive[] = [
  { slug: 'kong', titre_fr: 'Mosquée de Kong', titre_en: null, ville: 'Kong', type_id: 'religieux', image: 'https://x/1.jpg' },
  { slug: 'mairie', titre_fr: 'Mairie de Bassam', titre_en: null, ville: 'Grand-Bassam', type_id: 'civil', image: 'https://x/2.jpg' },
]

function monter(vignettes = V) {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <GrilleArchive vignettes={vignettes} types={TYPES} total={8} surtitre="Collections" titre="Archive photographique" />
    </NextIntlClientProvider>,
  )
}

describe('GrilleArchive', () => {
  it('affiche toutes les vignettes, chacune liée à sa fiche', () => {
    monter()
    expect(screen.getByRole('link', { name: /Mosquée de Kong/ })).toHaveAttribute('href', '/fr/patrimoine/kong')
    expect(screen.getByRole('link', { name: /Mairie de Bassam/ })).toHaveAttribute('href', '/fr/patrimoine/mairie')
  })

  it('filtre par type et revient à tout', async () => {
    monter()
    await userEvent.click(screen.getByRole('button', { name: 'Religieux' }))
    expect(screen.queryByText('Mairie de Bassam')).not.toBeInTheDocument()
    expect(screen.getByText('Mosquée de Kong')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Tout' }))
    expect(screen.getByText('Mairie de Bassam')).toBeInTheDocument()
  })

  it('n’affiche que les filtres réellement représentés', () => {
    monter([V[0]])
    expect(screen.getByRole('button', { name: 'Religieux' })).toBeInTheDocument()
    // Un filtre qui ne renverrait jamais rien est un piège pour l'utilisateur.
    expect(screen.queryByRole('button', { name: 'Civil' })).not.toBeInTheDocument()
  })

  it('le bouton final porte le total réel et mène aux archives', () => {
    monter()
    const lien = screen.getByRole('link', { name: /8 fiches/ })
    expect(lien).toHaveAttribute('href', '/fr/archives')
  })
})
