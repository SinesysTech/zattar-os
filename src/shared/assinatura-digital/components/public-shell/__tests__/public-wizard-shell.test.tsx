import { render, screen } from '@testing-library/react'
import { PublicWizardShell } from '../public-wizard-shell'

const steps = [
  { id: 'a', label: 'Aa' },
  { id: 'b', label: 'Bb' },
]

describe('PublicWizardShell', () => {
  it('renders header, progress and children', () => {
    render(
      <PublicWizardShell steps={steps} currentIndex={0}>
        <div data-testid="content">hello</div>
      </PublicWizardShell>,
    )
    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(screen.getAllByText('Aa').length).toBeGreaterThan(0)
  })

  it('does not render sidebar when steps is empty', () => {
    const { container } = render(
      <PublicWizardShell steps={[]} currentIndex={0}>
        <div>content</div>
      </PublicWizardShell>,
    )
    expect(container.querySelector('aside')).toBeFalsy()
  })
})
