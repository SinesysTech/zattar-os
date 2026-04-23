/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormStepLayout from '../form/form-step-layout'
import { useWizardProgress } from '@/shared/assinatura-digital/hooks/use-wizard-progress'

// Mock do hook de progresso — testes controlam o que ele retorna
jest.mock('@/shared/assinatura-digital/hooks/use-wizard-progress', () => ({
  useWizardProgress: jest.fn(() => ({
    currentStep: 0,
    totalSteps: 0,
    currentLabel: null,
    chipLabel: null,
    isVisibleInProgress: false,
  })),
}))

const mockedUseWizardProgress = useWizardProgress as jest.MockedFunction<
  typeof useWizardProgress
>

describe('FormStepLayout — public context (default)', () => {
  it('renderiza título via Heading do DS; description é aceita mas ignorada (design atual)', () => {
    render(
      <FormStepLayout title="Informe seu CPF" description="Digite seu CPF para iniciar">
        <div>conteúdo</div>
      </FormStepLayout>,
    )
    expect(screen.getByRole('heading', { name: /informe seu cpf/i, level: 1 })).toBeInTheDocument()
    // Subtítulos foram removidos do wizard público — chip + título comunicam contexto.
    expect(screen.queryByText(/digite seu cpf/i)).not.toBeInTheDocument()
  })

  it('botões primário e secundário têm altura mínima de 44px (h-11) — target touch WCAG AAA', () => {
    render(
      <FormStepLayout title="Passo" description="" onPrevious={() => {}} onNext={() => {}}>
        <div />
      </FormStepLayout>,
    )
    const next = screen.getByRole('button', { name: /continuar/i })
    const prev = screen.getByRole('button', { name: /voltar/i })
    expect(next.className).toMatch(/h-11/)
    expect(prev.className).toMatch(/h-11/)
  })

  it('aplica active:scale em ambos os botões (feedback tátil mobile)', () => {
    render(
      <FormStepLayout title="Passo" description="" onPrevious={() => {}} onNext={() => {}}>
        <div />
      </FormStepLayout>,
    )
    const next = screen.getByRole('button', { name: /continuar/i })
    const prev = screen.getByRole('button', { name: /voltar/i })
    // Aceita active:scale-95 OU active:scale-[0.98] — ambos são feedback tátil válido
    expect(next.className).toMatch(/active:scale-/)
    expect(prev.className).toMatch(/active:scale-/)
  })

  it('esconde botão Voltar quando hidePrevious=true', () => {
    render(
      <FormStepLayout title="Passo" description="" hidePrevious onNext={() => {}}>
        <div />
      </FormStepLayout>,
    )
    expect(screen.queryByRole('button', { name: /voltar/i })).not.toBeInTheDocument()
  })

  it('esconde botão Continuar quando hideNext=true', () => {
    render(
      <FormStepLayout title="Passo" description="" hideNext onPrevious={() => {}}>
        <div />
      </FormStepLayout>,
    )
    expect(screen.queryByRole('button', { name: /continuar/i })).not.toBeInTheDocument()
  })

  it('desabilita botão Continuar quando isNextDisabled=true', () => {
    render(
      <FormStepLayout title="Passo" description="" isNextDisabled onNext={() => {}}>
        <div />
      </FormStepLayout>,
    )
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled()
  })

  it('mostra loader e texto "Processando..." quando isLoading=true', () => {
    render(
      <FormStepLayout title="Passo" description="" isLoading onNext={() => {}}>
        <div />
      </FormStepLayout>,
    )
    expect(screen.getByRole('button', { name: /processando/i })).toBeInTheDocument()
  })

  it('custom nextLabel é renderizado', () => {
    render(
      <FormStepLayout title="Passo" description="" nextLabel="Assinar e finalizar" onNext={() => {}}>
        <div />
      </FormStepLayout>,
    )
    expect(screen.getByRole('button', { name: /assinar e finalizar/i })).toBeInTheDocument()
  })

  it('dispara onPrevious ao clicar em Voltar', async () => {
    const user = userEvent.setup()
    const onPrevious = jest.fn()
    render(
      <FormStepLayout title="Passo" description="" onPrevious={onPrevious} onNext={() => {}}>
        <div />
      </FormStepLayout>,
    )
    await user.click(screen.getByRole('button', { name: /voltar/i }))
    expect(onPrevious).toHaveBeenCalledTimes(1)
  })

  it('dispara onNext ao clicar em Continuar (quando sem formId)', async () => {
    const user = userEvent.setup()
    const onNext = jest.fn()
    render(
      <FormStepLayout title="Passo" description="" onNext={onNext}>
        <div />
      </FormStepLayout>,
    )
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('com formId, botão Continuar vira submit do formulário externo', () => {
    render(
      <FormStepLayout title="Passo" description="" formId="meu-form" onNext={() => {}}>
        <form id="meu-form" />
      </FormStepLayout>,
    )
    const button = screen.getByRole('button', { name: /continuar/i })
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toHaveAttribute('form', 'meu-form')
  })

  it('renderiza children dentro de ScrollArea interna (viewport-fit)', () => {
    render(
      <FormStepLayout title="Passo" description="">
        <div data-testid="step-content">conteúdo do step</div>
      </FormStepLayout>,
    )
    expect(screen.getByTestId('step-content')).toBeInTheDocument()
  })
})

describe('FormStepLayout — chip de etapa derivado do useWizardProgress', () => {
  beforeEach(() => {
    mockedUseWizardProgress.mockReset()
  })

  it('renderiza progressbar + contador "N/M" quando o hook retorna posição válida', () => {
    mockedUseWizardProgress.mockReturnValue({
      currentStep: 5,
      totalSteps: 9,
      currentLabel: 'Ação',
      chipLabel: 'Etapa 5 de 9',
      isVisibleInProgress: true,
    })

    render(
      <FormStepLayout title="Dados da Ação" description="">
        <div />
      </FormStepLayout>,
    )

    // Barra de progresso com aria-valuenow reflete currentStep.
    const progressbar = screen.getByRole('progressbar', { name: /progresso do formul/i })
    expect(progressbar).toHaveAttribute('aria-valuenow', '5')
    expect(progressbar).toHaveAttribute('aria-valuemax', '9')

    // Contador textual "5/9" no canto superior direito.
    expect(screen.getByText('5/9')).toBeInTheDocument()
  })

  it('omite barra e contador quando hook retorna isVisibleInProgress=false', () => {
    mockedUseWizardProgress.mockReturnValue({
      currentStep: 0,
      totalSteps: 9,
      currentLabel: null,
      chipLabel: null,
      isVisibleInProgress: false,
    })

    render(
      <FormStepLayout title="Pendentes" description="">
        <div />
      </FormStepLayout>,
    )

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})

describe('FormStepLayout — acessibilidade do PublicStepCard', () => {
  beforeEach(() => {
    mockedUseWizardProgress.mockReturnValue({
      currentStep: 1,
      totalSteps: 3,
      currentLabel: 'CPF',
      chipLabel: 'Etapa 1 de 3',
      isVisibleInProgress: true,
    })
  })

  it('section tem aria-labelledby apontando pro heading', () => {
    const { container } = render(
      <FormStepLayout title="Identifique-se" description="">
        <input data-testid="campo" placeholder="CPF" />
      </FormStepLayout>,
    )

    const heading = screen.getByRole('heading', { name: /identifique-se/i, level: 1 })
    const section = container.querySelector('section')
    expect(section).not.toBeNull()
    expect(section?.getAttribute('aria-labelledby')).toBe(heading.id)
  })

  it('não aplica aria-describedby (description foi deprecada no design atual)', () => {
    // Mesmo passando description, a prop é ignorada e o atributo não é emitido.
    const { container } = render(
      <FormStepLayout title="Identifique-se" description="Digite seu CPF">
        <div />
      </FormStepLayout>,
    )
    const section = container.querySelector('section')
    expect(section?.hasAttribute('aria-describedby')).toBe(false)
  })

  it('omite aria-describedby quando description ausente', () => {
    const { container } = render(
      <FormStepLayout title="Só título">
        <div />
      </FormStepLayout>,
    )

    const section = container.querySelector('section')
    expect(section?.hasAttribute('aria-describedby')).toBe(false)
  })

  it('heading tem tabIndex=-1 pra ser focável programaticamente', () => {
    render(
      <FormStepLayout title="Foco programático" description="">
        <div />
      </FormStepLayout>,
    )
    const heading = screen.getByRole('heading', { name: /foco program/i, level: 1 })
    expect(heading.getAttribute('tabIndex')).toBe('-1')
  })
})

describe('FormStepLayout — focus management após mount', () => {
  beforeEach(() => {
    mockedUseWizardProgress.mockReturnValue({
      currentStep: 1,
      totalSteps: 3,
      currentLabel: 'CPF',
      chipLabel: 'Etapa 1 de 3',
      isVisibleInProgress: true,
    })
  })

  it('foca primeiro input interativo do step ao montar', async () => {
    render(
      <FormStepLayout title="Tem inputs" description="">
        <input data-testid="primeiro" placeholder="primeiro" />
        <input data-testid="segundo" placeholder="segundo" />
      </FormStepLayout>,
    )

    // requestAnimationFrame → aguarda 1 frame
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

    expect(screen.getByTestId('primeiro')).toHaveFocus()
  })

  it('ignora inputs disabled, hidden e [tabindex=-1]', async () => {
    render(
      <FormStepLayout title="Pulando inputs" description="">
        <input disabled data-testid="disabled" placeholder="disabled" />
        <input type="hidden" data-testid="hidden" />
        <input tabIndex={-1} data-testid="negativo" placeholder="negativo" />
        <input data-testid="ok" placeholder="primeiro válido" />
      </FormStepLayout>,
    )

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

    expect(screen.getByTestId('ok')).toHaveFocus()
  })

  it('fallback: foca o heading quando não há input interativo', async () => {
    render(
      <FormStepLayout title="Sem inputs" description="" hidePrevious hideNext>
        <p>Apenas texto, sem campos.</p>
      </FormStepLayout>,
    )

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

    const heading = screen.getByRole('heading', { name: /sem inputs/i, level: 1 })
    expect(heading).toHaveFocus()
  })
})
