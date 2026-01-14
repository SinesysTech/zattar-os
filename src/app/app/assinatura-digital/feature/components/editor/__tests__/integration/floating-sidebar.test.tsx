import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FloatingSidebar from '../../components/FloatingSidebar';
import type { Signatario, EditorField, SignatureFieldType } from '../../types';

// Mock useViewport to always return desktop
jest.mock('@/hooks/use-viewport', () => ({
  useViewport: () => ({ isMobile: false, isDesktop: true }),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockSigners: Signatario[] = [
  { id: 'signer-1', nome: 'Signatário 1', email: 'signer1@test.com', cor: '#7C3AED', ordem: 0 },
  { id: 'signer-2', nome: 'Signatário 2', email: 'signer2@test.com', cor: '#3B82F6', ordem: 1 },
];

const mockFields: EditorField[] = [
  {
    id: 'field-1',
    nome: 'Campo Teste',
    tipo: 'texto',
    posicao: { x: 100, y: 100, width: 200, height: 20, pagina: 1 },
    isSelected: false,
    isDragging: false,
    signatario_id: 'signer-1',
  },
];

const defaultProps = {
  signers: mockSigners,
  activeSigner: mockSigners[0],
  onSelectSigner: jest.fn(),
  onAddSigner: jest.fn(),
  onUpdateSigner: jest.fn(),
  onDeleteSigner: jest.fn(),
  currentUserEmail: 'signer1@test.com',
  fields: mockFields,
  onPaletteDragStart: jest.fn(),
  onPaletteDragEnd: jest.fn(),
  onReviewAndSend: jest.fn(),
};

describe('FloatingSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the sidebar with header and sections', () => {
      render(<FloatingSidebar {...defaultProps} />);

      expect(screen.getByText('Configurar Documento')).toBeInTheDocument();
      expect(screen.getByText('Quem vai assinar?')).toBeInTheDocument();
      expect(screen.getByText('Arrastar Campos')).toBeInTheDocument();
    });

    it('should render all signers', () => {
      render(<FloatingSidebar {...defaultProps} />);

      expect(screen.getByText('Signatário 1')).toBeInTheDocument();
      expect(screen.getByText('Signatário 2')).toBeInTheDocument();
    });

    it('should render all field palette items', () => {
      render(<FloatingSidebar {...defaultProps} />);

      expect(screen.getByText('Assinatura')).toBeInTheDocument();
      expect(screen.getByText('Iniciais')).toBeInTheDocument();
      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.getByText('Texto')).toBeInTheDocument();
    });

    it('should show "You" badge for current user', () => {
      render(<FloatingSidebar {...defaultProps} />);

      expect(screen.getByText('Você')).toBeInTheDocument();
    });

    it('should render pro tip section', () => {
      render(<FloatingSidebar {...defaultProps} />);

      expect(screen.getByText('Dica')).toBeInTheDocument();
      expect(screen.getByText(/Shift/)).toBeInTheDocument();
    });

    it('should render field count', () => {
      render(<FloatingSidebar {...defaultProps} />);

      expect(screen.getByText(/1 campo/)).toBeInTheDocument();
    });
  });

  describe('signer selection', () => {
    it('should call onSelectSigner when clicking a signer card', async () => {
      const user = userEvent.setup();
      render(<FloatingSidebar {...defaultProps} />);

      const signerCard = screen.getByText('Signatário 2').closest('[role="button"]');
      expect(signerCard).toBeInTheDocument();

      await user.click(signerCard!);

      expect(defaultProps.onSelectSigner).toHaveBeenCalledWith(mockSigners[1]);
    });

    it('should highlight active signer', () => {
      render(<FloatingSidebar {...defaultProps} />);

      // The active signer card should have special styling
      const signerCard = screen.getByText('Signatário 1').closest('[role="button"]');
      expect(signerCard).toHaveClass('bg-primary/5');
    });
  });

  describe('add signer', () => {
    it('should open add signer dialog when clicking add button', async () => {
      const user = userEvent.setup();
      render(<FloatingSidebar {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /adicionar/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Adicionar Signatário')).toBeInTheDocument();
      });
    });
  });

  describe('drag and drop', () => {
    it('should call onPaletteDragStart when dragging a field card', () => {
      render(<FloatingSidebar {...defaultProps} />);

      const signatureCard = screen.getByText('Assinatura').closest('[draggable="true"]');
      expect(signatureCard).toBeInTheDocument();

      fireEvent.dragStart(signatureCard!);

      expect(defaultProps.onPaletteDragStart).toHaveBeenCalledWith('signature');
    });

    it('should call onPaletteDragEnd when drag ends', () => {
      render(<FloatingSidebar {...defaultProps} />);

      const signatureCard = screen.getByText('Assinatura').closest('[draggable="true"]');

      fireEvent.dragStart(signatureCard!);
      fireEvent.dragEnd(signatureCard!);

      expect(defaultProps.onPaletteDragEnd).toHaveBeenCalled();
    });
  });

  describe('filter toggle', () => {
    it('should show filter toggle when active signer is selected', () => {
      render(<FloatingSidebar {...defaultProps} />);

      expect(screen.getByText(/Mostrar apenas campos de/)).toBeInTheDocument();
    });

    it('should not show filter toggle when no active signer', () => {
      render(<FloatingSidebar {...defaultProps} activeSigner={null} />);

      expect(screen.queryByText(/Mostrar apenas campos de/)).not.toBeInTheDocument();
    });
  });

  describe('review button', () => {
    it('should render review and send button', () => {
      render(<FloatingSidebar {...defaultProps} />);

      expect(screen.getByText('Revisar e Enviar')).toBeInTheDocument();
    });

    it('should disable review button when no fields', () => {
      render(<FloatingSidebar {...defaultProps} fields={[]} />);

      const reviewButton = screen.getByText('Revisar e Enviar').closest('button');
      expect(reviewButton).toBeDisabled();
    });

    it('should call onReviewAndSend when clicking review button', async () => {
      const user = userEvent.setup();
      render(<FloatingSidebar {...defaultProps} />);

      const reviewButton = screen.getByText('Revisar e Enviar').closest('button');
      await user.click(reviewButton!);

      expect(defaultProps.onReviewAndSend).toHaveBeenCalled();
    });
  });
});
