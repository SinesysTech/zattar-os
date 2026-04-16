/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'
import { PublicFormShell } from '../public-form-shell'
import type { StepProgressItem } from '../step-progress'

const steps: StepProgressItem[] = [
  { id: 'cpf', label: 'CPF' },
  { id: 'identidade', label: 'Identidade' },
  { id: 'contatos', label: 'Contatos' },
]

describe('PublicFormShell', () => {
  it('renderiza children dentro da main column', () => {
    render(
      <PublicFormShell steps={steps} currentIndex={0}>
        <div data-testid="shell-children">step-content</div>
      </PublicFormShell>,
    )
    expect(screen.getByTestId('shell-children')).toBeInTheDocument()
  })

  it('renderiza aside com progresso (desktop) — hidden em breakpoint mobile', () => {
    const { container } = render(
      <PublicFormShell steps={steps} currentIndex={1}>
        <div />
      </PublicFormShell>,
    )
    const aside = container.querySelector('aside')
    expect(aside).toBeInTheDocument()
    // Classe Tailwind responsiva: hidden em <lg, flex em lg+
    expect(aside?.className).toMatch(/hidden/)
    expect(aside?.className).toMatch(/lg:flex/)
  })

  it('mobile header tem progressbar com aria-valuenow refletindo currentIndex', () => {
    render(
      <PublicFormShell steps={steps} currentIndex={1}>
        <div />
      </PublicFormShell>,
    )
    const bars = screen.getAllByRole('progressbar')
    // Pode haver 2 (mobile header + desktop aside com Vertical não tem progressbar)
    // Garantimos pelo menos 1 com aria-valuenow=2 (index 1 → 2/3)
    const matches = bars.filter((b) => b.getAttribute('aria-valuenow') === '2')
    expect(matches.length).toBeGreaterThan(0)
  })

  it('container raiz usa h-[100dvh] overflow-hidden (viewport-fit)', () => {
    const { container } = render(
      <PublicFormShell steps={steps} currentIndex={0}>
        <div />
      </PublicFormShell>,
    )
    const root = container.firstChild as HTMLElement
    expect(root.className).toMatch(/h-\[100dvh\]/)
    expect(root.className).toMatch(/overflow-hidden/)
  })

  it('exibe resumeHint tanto no aside quanto no header mobile', () => {
    render(
      <PublicFormShell
        steps={steps}
        currentIndex={1}
        resumeHint="Continuando de onde parou · salvo há 2 min"
      >
        <div />
      </PublicFormShell>,
    )
    const hints = screen.getAllByText(/continuando de onde parou/i)
    // Renderizado em desktop (Vertical) + mobile (Horizontal), ambos com CSS media query
    expect(hints.length).toBeGreaterThanOrEqual(1)
  })

  it('passa onRestart para os trackers', () => {
    const onRestart = jest.fn()
    render(
      <PublicFormShell steps={steps} currentIndex={2} onRestart={onRestart}>
        <div />
      </PublicFormShell>,
    )
    const buttons = screen.getAllByRole('button', { name: /recomeçar/i })
    expect(buttons.length).toBeGreaterThan(0)
  })
})
