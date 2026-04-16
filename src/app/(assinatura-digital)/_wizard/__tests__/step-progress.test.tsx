/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepProgress, type StepProgressItem } from '../step-progress'

const steps: StepProgressItem[] = [
  { id: 'cpf', label: 'CPF' },
  { id: 'identidade', label: 'Identidade' },
  { id: 'contatos', label: 'Contatos' },
  { id: 'endereco', label: 'Endereço' },
  { id: 'sucesso', label: 'Pronto' },
]

describe('StepProgress.Vertical (desktop)', () => {
  it('renderiza todos os steps com labels', () => {
    render(<StepProgress.Vertical steps={steps} currentIndex={1} />)
    for (const step of steps) {
      expect(screen.getByText(step.label)).toBeInTheDocument()
    }
  })

  it('marca o step atual com aria-current', () => {
    render(<StepProgress.Vertical steps={steps} currentIndex={2} />)
    const current = screen.getAllByRole('listitem')[2].querySelector('[aria-current="step"]')
    expect(current).toBeTruthy()
  })

  it('exibe botão "Recomeçar" quando onRestart é fornecido', async () => {
    const user = userEvent.setup()
    const onRestart = jest.fn()
    render(<StepProgress.Vertical steps={steps} currentIndex={3} onRestart={onRestart} />)
    const button = screen.getByRole('button', { name: /recomeçar/i })
    expect(button).toBeInTheDocument()
    await user.click(button)
    expect(onRestart).toHaveBeenCalledTimes(1)
  })

  it('omite botão "Recomeçar" quando onRestart não é fornecido', () => {
    render(<StepProgress.Vertical steps={steps} currentIndex={0} />)
    expect(screen.queryByRole('button', { name: /recomeçar/i })).not.toBeInTheDocument()
  })

  it('exibe resumeHint quando fornecido', () => {
    render(
      <StepProgress.Vertical
        steps={steps}
        currentIndex={2}
        resumeHint="Continuando de onde parou · salvo há 3 min"
      />,
    )
    expect(screen.getByText(/continuando de onde parou/i)).toBeInTheDocument()
  })
})

describe('StepProgress.Horizontal (mobile)', () => {
  it('exibe contador no formato "X/Y"', () => {
    render(<StepProgress.Horizontal steps={steps} currentIndex={1} />)
    expect(screen.getByText('2/5')).toBeInTheDocument()
  })

  it('exibe label do step atual', () => {
    render(<StepProgress.Horizontal steps={steps} currentIndex={3} />)
    expect(screen.getByText('Endereço')).toBeInTheDocument()
  })

  it('tem progressbar com aria-valuenow correto', () => {
    render(<StepProgress.Horizontal steps={steps} currentIndex={2} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuemax', '5')
  })

  it('botão de restart tem touch target de 32px (h-8)', () => {
    render(
      <StepProgress.Horizontal steps={steps} currentIndex={2} onRestart={() => {}} />,
    )
    const btn = screen.getByRole('button', { name: /recomeçar/i })
    expect(btn.className).toMatch(/h-8/)
    expect(btn.className).toMatch(/w-8/)
  })
})
