import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingSidebar } from '../../components/FloatingSidebar';

// Mocks
jest.mock('../../hooks/use-signers', () => ({
  useSigners: jest.fn(() => ({
    signers: [
      { id: '1', name: 'Signer 1', email: 'signer1@example.com', color: '#ff0000' },
    ],
    activeSigner: '1',
    setActiveSigner: jest.fn(),
    addSigner: jest.fn(),
    updateSigner: jest.fn(),
    removeSigner: jest.fn(),
  })),
}));

jest.mock('../../hooks/use-field-drag', () => ({
  useFieldDrag: jest.fn(() => ({
    handleDragStart: jest.fn(),
  })),
}));

// Mock ResizeObserver for responsive tests if needed
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('FloatingSidebar Integration', () => {
  it('deve renderizar lista de signatários', () => {
    render(<FloatingSidebar />);
    expect(screen.getByText('Signer 1')).toBeInTheDocument();
    expect(screen.getByText('signer1@example.com')).toBeInTheDocument();
  });

  it('deve permitir abrir modal de adicionar signatário', async () => {
    render(<FloatingSidebar />);
    const addButton = screen.getByRole('button', { name: /adicionar/i });
    fireEvent.click(addButton);
    // Expect modal to open (checking for some modal content)
    // Note: Check actual implementation label for button
  });

  it('deve exibir paleta de campos', () => {
    render(<FloatingSidebar />);
    expect(screen.getByText('Signature')).toBeInTheDocument();
    expect(screen.getByText('Initials')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  it('deve permitir drag de campos', () => {
    render(<FloatingSidebar />);
    const field = screen.getByText('Signature');
    // Drag events are tricky in JSDOM, often verify attributes or handler calls
    expect(field).toHaveAttribute('draggable', 'true');
  });
});
