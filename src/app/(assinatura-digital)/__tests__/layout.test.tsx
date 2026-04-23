/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react'
import PublicRouteLayout from '../layout'

// PublicRouteLayout é um Server Component async que chama `headers()` do
// Next.js 16. No ambiente jest não existe runtime Next, então mockamos headers
// retornando um Map-like com o nonce esperado.
jest.mock('next/headers', () => ({
  headers: jest.fn(async () => ({
    get: (name: string) => (name === 'x-nonce' ? 'test-nonce' : null),
  })),
}))

// Server Components async retornam Promise<ReactElement> — precisamos awaitar
// a chamada antes de passar o elemento para render().
async function renderAsyncLayout(children: React.ReactNode) {
  const element = await PublicRouteLayout({ children })
  return render(element)
}

describe('PublicRouteLayout', () => {
  it('wraps children with a light-theme enforcement script', async () => {
    const { container } = await renderAsyncLayout(
      <div data-testid="public-child">hello</div>,
    )
    expect(container.querySelector('[data-testid="public-child"]')).toBeTruthy()
    const script = container.querySelector('script[data-zattar-theme="force-light"]')
    expect(script).toBeTruthy()
  })

  it('script body performs the four theme-enforcement operations', async () => {
    const { container } = await renderAsyncLayout(<div />)
    const script = container.querySelector('script[data-zattar-theme="force-light"]')
    const code = script?.innerHTML ?? ''
    expect(code).toContain("classList.remove('dark')")
    expect(code).toContain("classList.add('light')")
    expect(code).toContain("setAttribute('data-theme', 'light')")
    expect(code).toContain("colorScheme = 'light'")
  })

  it('propaga o nonce do middleware no atributo nonce do script', async () => {
    const { container } = await renderAsyncLayout(<div />)
    const script = container.querySelector(
      'script[data-zattar-theme="force-light"]',
    ) as HTMLScriptElement | null
    expect(script?.getAttribute('nonce')).toBe('test-nonce')
  })
})
