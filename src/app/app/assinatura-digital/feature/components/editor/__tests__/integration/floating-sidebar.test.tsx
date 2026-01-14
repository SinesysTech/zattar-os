import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FloatingSidebar from '../../components/FloatingSidebar';
import type { Signatario, EditorField, SignatureFieldType } from '../../types';

// Mock useViewport
const mockUseViewport = jest.fn();
jest.mock('@/hooks/use-viewport', () => ({
  useViewport: () => mockUseViewport(),
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
    // Default to desktop viewport
    mockUseViewport.mockReturnValue({ isMobile: false, isDesktop: true });
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

    it('should render plural field count correctly', () => {
      const multipleFields: EditorField[] = [
        ...mockFields,
        { ...mockFields[0], id: 'field-2' },
        { ...mockFields[0], id: 'field-3' },
      ];
      render(<FloatingSidebar {...defaultProps} fields={multipleFields} />);

      expect(screen.getByText(/3 campos/)).toBeInTheDocument();
    });

    it('should render description text', () => {
      render(<FloatingSidebar {...defaultProps} />);

      expect(screen.getByText(/Adicione signatários e arraste os campos para o documento/)).toBeInTheDocument();
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

    it('should show signer color indicator in drag fields section', () => {
      render(<FloatingSidebar {...defaultProps} />);

      // There should be a color indicator showing the active signer's color
      const colorIndicator = document.querySelector('[title*="Cor do signatário"]');
      expect(colorIndicator).toBeInTheDocument();
      expect(colorIndicator).toHaveStyle({ backgroundColor: '#7C3AED' });
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

    it('should call onAddSigner with correct data when saving new signer', async () => {
      const user = userEvent.setup();
      render(<FloatingSidebar {...defaultProps} />);

      // Open add dialog
      const addButton = screen.getByRole('button', { name: /adicionar/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Adicionar Signatário')).toBeInTheDocument();
      });

      // Fill form
      const nomeInput = screen.getByLabelText(/nome/i);
      const emailInput = screen.getByLabelText(/email/i);

      await user.type(nomeInput, 'Novo Signatário');
      await user.type(emailInput, 'novo@test.com');

      // Submit
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      expect(defaultProps.onAddSigner).toHaveBeenCalledWith('Novo Signatário', 'novo@test.com');
    });
  });

  describe('edit signer', () => {
    it('should open edit dialog when clicking edit on signer', async () => {
      const user = userEvent.setup();
      render(<FloatingSidebar {...defaultProps} />);

      // Find the edit button for the first signer
      const signerCard = screen.getByText('Signatário 1').closest('[role="button"]');
      const editButton = within(signerCard as HTMLElement).getByRole('button', { name: /editar/i });

      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Editar Signatário')).toBeInTheDocument();
      });
    });

    it('should call onUpdateSigner with correct data when saving edited signer', async () => {
      const user = userEvent.setup();
      render(<FloatingSidebar {...defaultProps} />);

      // Open edit dialog
      const signerCard = screen.getByText('Signatário 1').closest('[role="button"]');
      const editButton = within(signerCard as HTMLElement).getByRole('button', { name: /editar/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Editar Signatário')).toBeInTheDocument();
      });

      // Clear and update name
      const nomeInput = screen.getByLabelText(/nome/i);
      await user.clear(nomeInput);
      await user.type(nomeInput, 'Nome Atualizado');

      // Submit
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(saveButton);

      expect(defaultProps.onUpdateSigner).toHaveBeenCalledWith('signer-1', expect.objectContaining({
        nome: 'Nome Atualizado',
      }));
    });
  });

  describe('delete signer', () => {
    it('should call onDeleteSigner when deleting a signer', async () => {
      const user = userEvent.setup();
      render(<FloatingSidebar {...defaultProps} />);

      // Find the delete button for the second signer (not current user)
      const signerCard = screen.getByText('Signatário 2').closest('[role="button"]');
      const deleteButton = within(signerCard as HTMLElement).getByRole('button', { name: /excluir|remover/i });

      await user.click(deleteButton);

      expect(defaultProps.onDeleteSigner).toHaveBeenCalledWith('signer-2');
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

    it('should set correct dataTransfer data on drag start', () => {
      render(<FloatingSidebar {...defaultProps} />);

      const initialsCard = screen.getByText('Iniciais').closest('[draggable="true"]');

      const dragEvent = {
        dataTransfer: {
          setData: jest.fn(),
          effectAllowed: '',
        },
      };

      fireEvent.dragStart(initialsCard!, dragEvent);

      expect(defaultProps.onPaletteDragStart).toHaveBeenCalledWith('initials');
    });

    it('should call onPaletteDragStart for all field types', () => {
      render(<FloatingSidebar {...defaultProps} />);

      const fieldTypes = ['Assinatura', 'Iniciais', 'Data', 'Texto'];
      const expectedTypes = ['signature', 'initials', 'date', 'textbox'];

      fieldTypes.forEach((label, index) => {
        jest.clearAllMocks();
        const card = screen.getByText(label).closest('[draggable="true"]');
        fireEvent.dragStart(card!);
        expect(defaultProps.onPaletteDragStart).toHaveBeenCalledWith(expectedTypes[index]);
      });
    });

    it('should handle keyboard activation for field palette cards', async () => {
      const user = userEvent.setup();
      render(<FloatingSidebar {...defaultProps} />);

      const signatureCard = screen.getByText('Assinatura').closest('[role="button"]');

      // Focus and press Enter
      signatureCard?.focus();
      await user.keyboard('{Enter}');

      expect(defaultProps.onPaletteDragStart).toHaveBeenCalledWith('signature');
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

    it('should filter fields when toggle is activated', async () => {
      const user = userEvent.setup();
      const mixedFields: EditorField[] = [
        { ...mockFields[0], id: 'field-1', signatario_id: 'signer-1' },
        { ...mockFields[0], id: 'field-2', signatario_id: 'signer-2' },
        { ...mockFields[0], id: 'field-3', signatario_id: 'signer-1' },
      ];

      render(<FloatingSidebar {...defaultProps} fields={mixedFields} />);

      // Initially should show all 3 fields count
      expect(screen.getByText(/3 campos/)).toBeInTheDocument();

      // Toggle filter
      const toggle = screen.getByRole('switch');
      await user.click(toggle);

      // Should now show only 2 fields (for signer-1)
      expect(screen.getByText(/2 campos/)).toBeInTheDocument();
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

    it('should enable review button when fields exist', () => {
      render(<FloatingSidebar {...defaultProps} />);

      const reviewButton = screen.getByText('Revisar e Enviar').closest('button');
      expect(reviewButton).not.toBeDisabled();
    });
  });

  describe('responsiveness', () => {
    it('should render fixed sidebar on desktop', () => {
      mockUseViewport.mockReturnValue({ isMobile: false, isDesktop: true });
      render(<FloatingSidebar {...defaultProps} />);

      // Should render as fixed sidebar, not a sheet
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText('Configurar Documento')).toBeInTheDocument();
    });

    it('should render as sheet trigger (FAB) on mobile', () => {
      mockUseViewport.mockReturnValue({ isMobile: true, isDesktop: false });
      render(<FloatingSidebar {...defaultProps} />);

      // Should render FAB button
      const fabButton = screen.getByRole('button', { name: /abrir configurações/i });
      expect(fabButton).toBeInTheDocument();
    });

    it('should open sheet when FAB is clicked on mobile', async () => {
      const user = userEvent.setup();
      mockUseViewport.mockReturnValue({ isMobile: true, isDesktop: false });
      render(<FloatingSidebar {...defaultProps} />);

      const fabButton = screen.getByRole('button', { name: /abrir configurações/i });
      await user.click(fabButton);

      // Sheet content should now be visible
      await waitFor(() => {
        expect(screen.getByText('Configurar Documento')).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have accessible field palette cards', () => {
      render(<FloatingSidebar {...defaultProps} />);

      const signatureCard = screen.getByRole('button', { name: /arrastar campo assinatura/i });
      expect(signatureCard).toBeInTheDocument();
    });

    it('should have focus visible styles on field palette cards', () => {
      render(<FloatingSidebar {...defaultProps} />);

      const signatureCard = screen.getByText('Assinatura').closest('[role="button"]');
      expect(signatureCard).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('should allow keyboard navigation through field palette', async () => {
      const user = userEvent.setup();
      render(<FloatingSidebar {...defaultProps} />);

      // Tab through field palette items
      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab();

      // Check that a palette item is focused
      const focusedElement = document.activeElement;
      expect(focusedElement).toHaveAttribute('role', 'button');
    });
  });

  describe('pro tip section', () => {
    it('should render pro tip with Shift shortcut', () => {
      render(<FloatingSidebar {...defaultProps} />);

      expect(screen.getByText('Dica')).toBeInTheDocument();
      expect(screen.getByText(/Shift/)).toBeInTheDocument();
    });

    it('should render keyboard shortcut in kbd element', () => {
      render(<FloatingSidebar {...defaultProps} />);

      const kbdElement = screen.getByText('Shift');
      expect(kbdElement.tagName).toBe('KBD');
    });
  });
});
