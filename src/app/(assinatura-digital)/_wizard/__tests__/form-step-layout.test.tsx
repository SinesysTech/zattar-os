/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormStepLayout from '../form/form-step-layout'

describe('FormStepLayout — public context (default)', () => {
  it('renderiza título e descrição via Heading/Text do DS', () => {
    render(
      <FormStepLayout title="Informe seu CPF" description="Digite seu CPF para iniciar">
        <div>conteúdo</div>
      </FormStepLayout>,
    )
    expect(screen.getByRole('heading', { name: /informe seu cpf/i, level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/digite seu cpf/i)).toBeInTheDocument()
  })

  it('botões primário e secundário têm altura mínima de 48px (h-12)', () => {
    render(
      <FormStepLayout title="Passo" description="" onPrevious={() => {}} onNext={() => {}}>
        <div />
      </FormStepLayout>,
    )
    const next = screen.getByRole('button', { name: /continuar/i })
    const prev = screen.getByRole('button', { name: /voltar/i })
    expect(next.className).toMatch(/h-12/)
    expect(prev.className).toMatch(/h-12/)
  })

  it('aplica active:scale-95 em ambos os botões (feedback tátil mobile)', () => {
    render(
      <FormStepLayout title="Passo" description="" onPrevious={() => {}} onNext={() => {}}>
        <div />
      </FormStepLayout>,
    )
    const next = screen.getByRole('button', { name: /continuar/i })
    const prev = screen.getByRole('button', { name: /voltar/i })
    expect(next.className).toMatch(/active:scale-95/)
    expect(prev.className).toMatch(/active:scale-95/)
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

describe('FormStepLayout — internal context (retrocompat admin)', () => {
  it('não aplica layout viewport-fit quando context="internal"', () => {
    const { container } = render(
      <FormStepLayout title="Passo" description="" context="internal">
        <div />
      </FormStepLayout>,
    )
    // internal mode usa GlassPanel raiz, não o layout de viewport público
    const viewportDiv = container.querySelector('.h-\\[100dvh\\]')
    expect(viewportDiv).toBeNull()
  })
})
