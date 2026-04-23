import { render, screen } from '@testing-library/react'
import { PublicWizardShell } from '../public-wizard-shell'

describe('PublicWizardShell', () => {
  it('renders BrandMark, ambient backdrop and children', () => {
    const { container } = render(
      <PublicWizardShell>
        <div data-testid="content">hello</div>
      </PublicWizardShell>,
    )

    // Conteúdo da rota pública deve ser passado através.
    expect(screen.getByTestId('content')).toBeInTheDocument()

    // Shell deve expor landmark para skip-link + screen readers.
    expect(container.querySelector('main#main-content')).toBeTruthy()
    expect(container.querySelector('[data-wizard-public]')).toBeTruthy()
  })

  it('does not render any sidebar (progresso foi movido pra dentro do PublicStepCard)', () => {
    const { container } = render(
      <PublicWizardShell>
        <div>content</div>
      </PublicWizardShell>,
    )
    expect(container.querySelector('aside')).toBeFalsy()
  })

  it('aceita props deprecadas (steps/currentIndex) sem quebrar — compat transitória', () => {
    // Essas props são silenciosamente ignoradas pelo componente atual. O teste
    // serve só para garantir que o contrato de compat não regrediu.
    const steps = [{ id: 'a', label: 'Aa' }, { id: 'b', label: 'Bb' }]
    const { container } = render(
      <PublicWizardShell steps={steps} currentIndex={0}>
        <div data-testid="content">hello</div>
      </PublicWizardShell>,
    )
    expect(screen.getByTestId('content')).toBeInTheDocument()
    // Labels dos steps NÃO devem aparecer — o progresso vive dentro do card.
    expect(screen.queryByText('Aa')).not.toBeInTheDocument()
    expect(container.querySelector('aside')).toBeFalsy()
  })
})
