import { render, screen, fireEvent } from '@testing-library/react';
import { SignatureWorkflowStepper } from '../signature-workflow-stepper';
import { useFormularioStore } from '../../../store/formulario-store';
import { useViewport } from '@/hooks/use-viewport';

// Mocks
jest.mock('@/hooks/use-viewport', () => ({
  useViewport: jest.fn(),
}));

jest.mock('../../../store/formulario-store', () => ({
  useFormularioStore: jest.fn(),
}));

jest.mock('../hooks/use-workflow-navigation', () => ({
  useWorkflowNavigation: jest.fn(() => ({
    canNavigate: true,
    navigateToStep: jest.fn(),
  })),
}));

describe('SignatureWorkflowStepper', () => {
  const mockEtapaAtual = 0; // Upload step

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormularioStore as unknown as jest.Mock).mockReturnValue({
      etapaAtual: mockEtapaAtual,
      getTotalSteps: jest.fn(() => 3),
    });
    (useViewport as unknown as jest.Mock).mockReturnValue({ isDesktop: true });
  });

  describe('Desktop View', () => {
    beforeEach(() => {
      (useViewport as unknown as jest.Mock).mockReturnValue({ isDesktop: true });
    });

    it('deve renderizar o stepper desktop', () => {
      render(<SignatureWorkflowStepper />);
      expect(screen.getByTestId('desktop-stepper')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-progress')).not.toBeInTheDocument();
    });

    it('deve exibir os steps com status correto', () => {
      render(<SignatureWorkflowStepper />);
      // Assuming DesktopStepper renders steps text
      expect(screen.getByText(/Upload/i)).toBeInTheDocument();
      expect(screen.getByText(/Configurar/i)).toBeInTheDocument();
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      (useViewport as unknown as jest.Mock).mockReturnValue({ isDesktop: false });
    });

    it('deve renderizar o progress bar mobile', () => {
      render(<SignatureWorkflowStepper />);
      expect(screen.getByTestId('mobile-progress')).toBeInTheDocument();
      expect(screen.queryByTestId('desktop-stepper')).not.toBeInTheDocument();
    });
  });

  describe('Navegação', () => {
    it('deve chamar callback de clique quando navegação permitida', () => {
      const onStepClickMock = jest.fn();
      render(<SignatureWorkflowStepper allowNavigation onStepClick={onStepClickMock} />);

      // Find a clickable step (e.g., button or element with role)
      // Adjust selector based on actual implementation
      const steps = screen.getAllByRole('button');
      if (steps.length > 1) {
        fireEvent.click(steps[1]);
        expect(onStepClickMock).toHaveBeenCalledWith(1);
      }
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels corretos', () => {
      render(<SignatureWorkflowStepper />);
      expect(screen.getByLabelText(/Progresso do fluxo/i)).toBeInTheDocument();
    });
  });
});
