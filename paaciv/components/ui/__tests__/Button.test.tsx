import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

test('le bouton "gold" affiche son libellé et la classe d\'accent', () => {
  render(<Button variant="gold">Explorer</Button>)
  const btn = screen.getByRole('button', { name: 'Explorer' })
  expect(btn.className).toContain('bg-or')
})
