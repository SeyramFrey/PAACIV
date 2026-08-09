import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TexteRiche } from '@/components/patrimoine/TexteRiche'

describe('TexteRiche', () => {
  it('rend le HTML assaini et retire le script', () => {
    const { container } = render(<TexteRiche html={'<p>Salut</p><script>alert(1)</script>'} />)
    expect(container.querySelector('p')?.textContent).toBe('Salut')
    expect(container.querySelector('script')).toBeNull()
  })

  it('conserve les listes et titres autorisés', () => {
    const { container } = render(<TexteRiche html={'<h2>T</h2><ul><li>a</li></ul>'} />)
    expect(container.querySelector('h2')?.textContent).toBe('T')
    expect(container.querySelector('li')?.textContent).toBe('a')
  })

  it('vide → ne rend rien', () => {
    const { container } = render(<TexteRiche html={null} />)
    expect(container.firstChild).toBeNull()
  })
})
