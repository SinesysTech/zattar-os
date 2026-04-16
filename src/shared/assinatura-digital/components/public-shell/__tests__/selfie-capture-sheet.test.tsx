import { render, screen, fireEvent } from '@testing-library/react'
import { SelfieCaptureSheet } from '../selfie-capture-sheet'

describe('SelfieCaptureSheet', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(
      <SelfieCaptureSheet open={false} onSkip={() => {}} onCapture={() => {}} />,
    )
    expect(container.querySelector('[role="dialog"]')).toBeFalsy()
  })

  it('renders dialog with title and capture/skip buttons when open', () => {
    render(<SelfieCaptureSheet open onSkip={() => {}} onCapture={() => {}} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pular/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /capturar/i })).toBeInTheDocument()
  })

  it('fires onSkip when skip button is clicked', () => {
    const onSkip = jest.fn()
    render(<SelfieCaptureSheet open onSkip={onSkip} onCapture={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /pular/i }))
    expect(onSkip).toHaveBeenCalled()
  })

  it('fires onSkip when close (X) button is clicked', () => {
    const onSkip = jest.fn()
    render(<SelfieCaptureSheet open onSkip={onSkip} onCapture={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /fechar/i }))
    expect(onSkip).toHaveBeenCalled()
  })
})
