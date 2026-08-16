import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { Activites } from '@/components/accueil/Activites'
import type { Activite } from '@/lib/data/accueil'

const A: Activite[] = [
  { id: '1', titre_fr: 'Inventaire', titre_en: null, cadence_fr: 'Toute l’année', cadence_en: null, description_fr: 'Campagnes mensuelles.', description_en: null, cta_libelle_fr: 'Consulter', cta_libelle_en: null, cta_href: '/archives', image: null },
  { id: '2', titre_fr: 'Visites', titre_en: null, cadence_fr: 'Deux samedis', cadence_en: null, description_fr: 'Marche commentée.', description_en: null, cta_libelle_fr: 'Voir', cta_libelle_en: null, cta_href: '/evenements', image: null },
]

function monter(activites = A) {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <Activites activites={activites} surtitre="Nos activités" titre="Ce que nous faisons" intro="" />
    </NextIntlClientProvider>,
  )
}

describe('Activites', () => {
  it('expose un onglet par activité, le premier sélectionné', () => {
    monter()
    const onglets = screen.getAllByRole('tab')
    expect(onglets).toHaveLength(2)
    expect(onglets[0]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Campagnes mensuelles.')).toBeVisible()
  })

  it('change de panneau au clic', async () => {
    monter()
    await userEvent.click(screen.getAllByRole('tab')[1])
    expect(screen.getByText('Marche commentée.')).toBeVisible()
    expect(screen.queryByText('Campagnes mensuelles.')).not.toBeInTheDocument()
  })

  it('le CTA du panneau pointe vers la route de l’activité', async () => {
    monter()
    expect(screen.getByRole('link', { name: /consulter/i })).toHaveAttribute('href', '/fr/archives')
  })

  it('ne rend rien sans activité', () => {
    const { container } = monter([])
    expect(container).toBeEmptyDOMElement()
  })
})
