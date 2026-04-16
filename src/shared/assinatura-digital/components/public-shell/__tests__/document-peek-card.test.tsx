import { render, screen } from '@testing-library/react'
import { DocumentPeekCard } from '../document-peek-card'

describe('DocumentPeekCard', () => {
  it('renders file name, sender and date', () => {
    render(
      <DocumentPeekCard fileName="Contrato.pdf" sender="Zattar Advogados" date="12 de abril" />,
    )
    expect(screen.getByText('Contrato.pdf')).toBeInTheDocument()
    expect(screen.getByText(/Zattar Advogados/)).toBeInTheDocument()
    expect(screen.getByText(/12 de abril/)).toBeInTheDocument()
  })
})
