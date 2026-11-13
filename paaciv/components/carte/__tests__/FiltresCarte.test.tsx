import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { FiltresCarte } from '@/components/carte/FiltresCarte'

const messages = {
  carte: { recherche: 'Rechercher un édifice…', type: 'Type', programme: 'Programme', district: 'District', epoque: 'Époque', etat: 'État', tous: 'Tous' },
  etats: {
    bon_etat: 'Bon état',
    etat_moyen: 'État moyen',
    degrade: 'Dégradé',
    fortement_degrade: 'Fortement dégradé',
    ruine: 'Ruiné',
    menace: 'Menacé',
  },
}
const options = {
  types: [{ id: 'religieux', nom_fr: 'Religieux', nom_en: 'Religious', couleur: '#8A3E1B', ordre: 1 }],
  programmes: [], districts: [], epoques: [],
} as never

function renderFiltres(onChange = vi.fn()) {
  render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <FiltresCarte options={options} valeurs={{ type: '', programme: '', district: '', epoque: '', etat: '' }} onChange={onChange} locale="fr" />
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

  it('émet onChange(etat, slug) — la valeur envoyée est le slug, pas le libellé', () => {
    const onChange = renderFiltres()
    fireEvent.change(screen.getByLabelText('État'), { target: { value: 'degrade' } })
    expect(onChange).toHaveBeenCalledWith('etat', 'degrade')
  })

  it('propose le groupe « menacé » puis les cinq états, libellés traduits', () => {
    renderFiltres()
    const options = Array.from(
      screen.getByLabelText('État').querySelectorAll('option'),
    ).map((o) => [o.getAttribute('value'), o.textContent])
    expect(options).toEqual([
      ['', 'Tous'],
      ['menace', 'Menacé'],
      ['bon_etat', 'Bon état'],
      ['etat_moyen', 'État moyen'],
      ['degrade', 'Dégradé'],
      ['fortement_degrade', 'Fortement dégradé'],
      ['ruine', 'Ruiné'],
    ])
  })
})
