import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { FiltresCarte } from '@/components/carte/FiltresCarte'

const messages = {
  carte: { recherche: 'Rechercher un édifice…', type: 'Type', programme: 'Programme', district: 'District', epoque: 'Époque', tous: 'Tous' },
}
const options = {
  types: [{ id: 'religieux', nom_fr: 'Religieux', nom_en: 'Religious', couleur: '#8A3E1B', ordre: 1 }],
  programmes: [], districts: [], epoques: [],
} as never

function renderFiltres(onChange = vi.fn()) {
  render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <FiltresCarte options={options} valeurs={{ type: '', programme: '', district: '', epoque: '' }} onChange={onChange} locale="fr" />
    </NextIntlClientProvider>,
  )
  return onChange
}

describe('FiltresCarte', () => {
  it('émet onChange(type, valeur) au changement de select', () => {
    const onChange = renderFiltres()
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'religieux' } })
    expect(onChange).toHaveBeenCalledWith('type', 'religieux')
  })

  it('émet onChange(q, valeur) à la saisie de recherche', () => {
    const onChange = renderFiltres()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'gare' } })
    expect(onChange).toHaveBeenCalledWith('q', 'gare')
  })
})
