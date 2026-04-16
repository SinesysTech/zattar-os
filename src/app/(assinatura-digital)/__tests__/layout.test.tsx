import { render } from '@testing-library/react'
import PublicRouteLayout from '../layout'

describe('PublicRouteLayout', () => {
  it('wraps children with a light-theme enforcement script', () => {
    const { container } = render(
      <PublicRouteLayout>
        <div data-testid="public-child">hello</div>
      </PublicRouteLayout>,
    )
    expect(container.querySelector('[data-testid="public-child"]')).toBeTruthy()
    const script = container.querySelector('script[data-zattar-theme="force-light"]')
    expect(script).toBeTruthy()
  })
})
