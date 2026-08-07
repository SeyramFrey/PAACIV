import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './page'

describe('Home', () => {
  it('affiche la page racine sans erreur', () => {
    render(<Home />)
    expect(
      screen.getByText(/To get started, edit the/i)
    ).toBeInTheDocument()
  })
})
