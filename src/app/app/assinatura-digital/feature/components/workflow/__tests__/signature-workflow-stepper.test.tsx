import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignatureWorkflowStepper } from '../signature-workflow-stepper';
import { useViewport } from '@/hooks/use-viewport';
import { useWorkflowNavigation } from '../hooks/use-workflow-navigation';
import type { WorkflowStep } from '../types';

// Mock dependencies
jest.mock('@/hooks/use-viewport');
jest.mock('../hooks/use-workflow-navigation');

// Mock child components
jest.mock('../components/desktop-stepper', () => ({
  DesktopStepper: ({
    steps,
    onStepClick,
    allowNavigation,
  }: {
    steps: WorkflowStep[];
    onStepClick: (index: number) => void;
    allowNavigation: boolean;
  }) => (
    <div data-testid="desktop-stepper">
      {steps.map((step) => (
        <button
          key={step.id}
          data-testid={`step-${step.id}`}
          data-status={step.status}
          onClick={() => allowNavigation && onStepClick(step.index)}
          disabled={!allowNavigation}
          aria-label={step.label}
          className={step.status}
        >
          {step.label}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('../components/mobile-progress', () => ({
  MobileProgress: ({
    currentStep,
    totalSteps,
    progressPercentage,
    currentStepLabel,
  }: {
    currentStep: number;
    totalSteps: number;
    progressPercentage: number;
    currentStepLabel?: string;
  }) => (
    <div data-testid="mobile-progress">
      <div data-testid="progress-bar" style={{ width: `${progressPercentage}%` }} />
      <span data-testid="step-label">{currentStepLabel}</span>
      <span data-testid="step-counter">
        {currentStep + 1} de {totalSteps}
      </span>
    </div>
  ),
}));

// Default mock data
const defaultSteps: WorkflowStep[] = [
  { id: 'upload', index: 0, label: 'Upload', status: 'completed' },
  { id: 'configurar', index: 1, label: 'Configurar', status: 'current' },
  { id: 'revisar', index: 2, label: 'Revisar', status: 'pending' },
];

const defaultNavigationState = {
  steps: defaultSteps,
  currentStep: 1,
  totalSteps: 3,
  canGoBack: true,
  canGoForward: true,
  goToStep: jest.fn(),
  nextStep: jest.fn(),
  previousStep: jest.fn(),
  progressPercentage: 50,
};

describe('SignatureWorkflowStepper', () => {
  const mockOnStepClick = jest.fn();
  const mockGoToStep = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default viewport: desktop
    (useViewport as jest.Mock).mockReturnValue({
      isMobile: false,
      isDesktop: true,
      isTablet: false,
      width: 1024,
    });

    // Default navigation state
    (useWorkflowNavigation as jest.Mock).mockReturnValue({
      ...defaultNavigationState,
      goToStep: mockGoToStep,
    });
  });

  describe('Rendering', () => {
    it('should render the stepper with correct aria-label', () => {
      render(<SignatureWorkflowStepper />);

      expect(screen.getByRole('navigation')).toHaveAttribute(
        'aria-label',
        'Progresso do fluxo de assinatura'
      );
    });

    it('should render with data-testid workflow-stepper', () => {
      render(<SignatureWorkflowStepper />);

      expect(screen.getByTestId('workflow-stepper')).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      render(<SignatureWorkflowStepper className="custom-class" />);

      expect(screen.getByRole('navigation')).toHaveClass('custom-class');
    });
  });

  describe('Desktop Rendering', () => {
    beforeEach(() => {
      (useViewport as jest.Mock).mockReturnValue({
        isMobile: false,
        isDesktop: true,
        isTablet: false,
        width: 1024,
      });
    });

    it('should render DesktopStepper on desktop viewport', () => {
      render(<SignatureWorkflowStepper />);

      expect(screen.getByTestId('desktop-stepper')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-progress')).not.toBeInTheDocument();
    });

    it('should render all steps in desktop stepper', () => {
      render(<SignatureWorkflowStepper />);

      expect(screen.getByTestId('step-upload')).toBeInTheDocument();
      expect(screen.getByTestId('step-configurar')).toBeInTheDocument();
      expect(screen.getByTestId('step-revisar')).toBeInTheDocument();
    });

    it('should show correct step status in desktop stepper', () => {
      render(<SignatureWorkflowStepper />);

      expect(screen.getByTestId('step-upload')).toHaveAttribute('data-status', 'completed');
      expect(screen.getByTestId('step-configurar')).toHaveAttribute('data-status', 'current');
      expect(screen.getByTestId('step-revisar')).toHaveAttribute('data-status', 'pending');
    });
  });

  describe('Mobile Rendering', () => {
    beforeEach(() => {
      (useViewport as jest.Mock).mockReturnValue({
        isMobile: true,
        isDesktop: false,
        isTablet: false,
        width: 375,
      });
    });

    it('should render MobileProgress on mobile viewport', () => {
      render(<SignatureWorkflowStepper />);

      expect(screen.getByTestId('mobile-progress')).toBeInTheDocument();
      expect(screen.queryByTestId('desktop-stepper')).not.toBeInTheDocument();
    });

    it('should show current step label in mobile progress', () => {
      render(<SignatureWorkflowStepper />);

      expect(screen.getByTestId('step-label')).toHaveTextContent('Configurar');
    });

    it('should show correct step counter in mobile progress', () => {
      render(<SignatureWorkflowStepper />);

      expect(screen.getByTestId('step-counter')).toHaveTextContent('2 de 3');
    });

    it('should show progress bar with correct percentage', () => {
      render(<SignatureWorkflowStepper />);

      expect(screen.getByTestId('progress-bar')).toHaveStyle({ width: '50%' });
    });
  });

  describe('Navigation', () => {
    it('should call onStepClick when allowNavigation is true', async () => {
      const user = userEvent.setup();

      render(<SignatureWorkflowStepper allowNavigation onStepClick={mockOnStepClick} />);

      await user.click(screen.getByTestId('step-upload'));

      expect(mockGoToStep).toHaveBeenCalledWith(0);
      expect(mockOnStepClick).toHaveBeenCalledWith(0);
    });

    it('should not call onStepClick when allowNavigation is false', async () => {
      const user = userEvent.setup();

      render(<SignatureWorkflowStepper allowNavigation={false} onStepClick={mockOnStepClick} />);

      await user.click(screen.getByTestId('step-upload'));

      expect(mockGoToStep).not.toHaveBeenCalled();
      expect(mockOnStepClick).not.toHaveBeenCalled();
    });

    it('should disable navigation buttons when allowNavigation is false', () => {
      render(<SignatureWorkflowStepper allowNavigation={false} />);

      expect(screen.getByTestId('step-upload')).toBeDisabled();
      expect(screen.getByTestId('step-configurar')).toBeDisabled();
      expect(screen.getByTestId('step-revisar')).toBeDisabled();
    });

    it('should enable navigation buttons when allowNavigation is true', () => {
      render(<SignatureWorkflowStepper allowNavigation />);

      expect(screen.getByTestId('step-upload')).not.toBeDisabled();
      expect(screen.getByTestId('step-configurar')).not.toBeDisabled();
      expect(screen.getByTestId('step-revisar')).not.toBeDisabled();
    });
  });

  describe('Store Integration', () => {
    it('should use currentStep from useWorkflowNavigation', () => {
      (useWorkflowNavigation as jest.Mock).mockReturnValue({
        ...defaultNavigationState,
        currentStep: 2,
      });

      render(<SignatureWorkflowStepper />);

      // The screen reader text should reflect the current step
      expect(screen.getByText(/Etapa 3 de 3/)).toBeInTheDocument();
    });

    it('should use steps from useWorkflowNavigation', () => {
      const customSteps: WorkflowStep[] = [
        { id: 'step1', index: 0, label: 'Step 1', status: 'completed' },
        { id: 'step2', index: 1, label: 'Step 2', status: 'current' },
      ];

      (useWorkflowNavigation as jest.Mock).mockReturnValue({
        ...defaultNavigationState,
        steps: customSteps,
        totalSteps: 2,
        currentStep: 1,
      });

      render(<SignatureWorkflowStepper />);

      expect(screen.getByTestId('step-step1')).toBeInTheDocument();
      expect(screen.getByTestId('step-step2')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on navigation element', () => {
      render(<SignatureWorkflowStepper />);

      expect(screen.getByRole('navigation')).toHaveAttribute(
        'aria-label',
        'Progresso do fluxo de assinatura'
      );
    });

    it('should have aria-live region for screen readers', () => {
      render(<SignatureWorkflowStepper />);

      const liveRegion = screen.getByText(/Etapa 2 de 3: Configurar/);
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
      expect(liveRegion).toHaveClass('sr-only');
    });

    it('should announce current step to screen readers', () => {
      render(<SignatureWorkflowStepper />);

      expect(screen.getByText(/Etapa 2 de 3: Configurar/)).toBeInTheDocument();
    });

    it('should update announcement when step changes', () => {
      const { rerender } = render(<SignatureWorkflowStepper />);

      expect(screen.getByText(/Etapa 2 de 3: Configurar/)).toBeInTheDocument();

      // Simulate step change
      (useWorkflowNavigation as jest.Mock).mockReturnValue({
        ...defaultNavigationState,
        currentStep: 2,
        steps: [
          { id: 'upload', index: 0, label: 'Upload', status: 'completed' },
          { id: 'configurar', index: 1, label: 'Configurar', status: 'completed' },
          { id: 'revisar', index: 2, label: 'Revisar', status: 'current' },
        ],
      });

      rerender(<SignatureWorkflowStepper />);

      expect(screen.getByText(/Etapa 3 de 3: Revisar/)).toBeInTheDocument();
    });
  });

  describe('Progress Percentage', () => {
    it('should calculate correct percentage for step 0', () => {
      (useViewport as jest.Mock).mockReturnValue({ isMobile: true });
      (useWorkflowNavigation as jest.Mock).mockReturnValue({
        ...defaultNavigationState,
        currentStep: 0,
        progressPercentage: 0,
      });

      render(<SignatureWorkflowStepper />);

      expect(screen.getByTestId('progress-bar')).toHaveStyle({ width: '0%' });
    });

    it('should calculate correct percentage for step 1 of 3', () => {
      (useViewport as jest.Mock).mockReturnValue({ isMobile: true });
      (useWorkflowNavigation as jest.Mock).mockReturnValue({
        ...defaultNavigationState,
        currentStep: 1,
        progressPercentage: 50,
      });

      render(<SignatureWorkflowStepper />);

      expect(screen.getByTestId('progress-bar')).toHaveStyle({ width: '50%' });
    });

    it('should calculate correct percentage for final step', () => {
      (useViewport as jest.Mock).mockReturnValue({ isMobile: true });
      (useWorkflowNavigation as jest.Mock).mockReturnValue({
        ...defaultNavigationState,
        currentStep: 2,
        progressPercentage: 100,
      });

      render(<SignatureWorkflowStepper />);

      expect(screen.getByTestId('progress-bar')).toHaveStyle({ width: '100%' });
    });
  });

  describe('Step Status', () => {
    it('should mark completed steps correctly', () => {
      render(<SignatureWorkflowStepper />);

      expect(screen.getByTestId('step-upload')).toHaveClass('completed');
    });

    it('should mark current step correctly', () => {
      render(<SignatureWorkflowStepper />);

      expect(screen.getByTestId('step-configurar')).toHaveClass('current');
    });

    it('should mark pending steps correctly', () => {
      render(<SignatureWorkflowStepper />);

      expect(screen.getByTestId('step-revisar')).toHaveClass('pending');
    });
  });

  describe('Default Props', () => {
    it('should default allowNavigation to false', () => {
      render(<SignatureWorkflowStepper />);

      // Buttons should be disabled by default
      expect(screen.getByTestId('step-upload')).toBeDisabled();
    });

    it('should work without onStepClick callback', async () => {
      const user = userEvent.setup();

      // Should not throw when clicked without callback
      render(<SignatureWorkflowStepper allowNavigation />);

      await user.click(screen.getByTestId('step-upload'));

      expect(mockGoToStep).toHaveBeenCalledWith(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single step workflow', () => {
      (useWorkflowNavigation as jest.Mock).mockReturnValue({
        steps: [{ id: 'only-step', index: 0, label: 'Only Step', status: 'current' }],
        currentStep: 0,
        totalSteps: 1,
        progressPercentage: 100,
        canGoBack: false,
        canGoForward: false,
        goToStep: mockGoToStep,
        nextStep: jest.fn(),
        previousStep: jest.fn(),
      });

      render(<SignatureWorkflowStepper />);

      expect(screen.getByTestId('step-only-step')).toBeInTheDocument();
      expect(screen.getByText(/Etapa 1 de 1/)).toBeInTheDocument();
    });

    it('should handle empty current step label gracefully', () => {
      (useWorkflowNavigation as jest.Mock).mockReturnValue({
        ...defaultNavigationState,
        steps: [
          { id: 'upload', index: 0, label: '', status: 'current' },
        ],
        currentStep: 0,
        totalSteps: 1,
      });

      render(<SignatureWorkflowStepper />);

      // Should render without crashing
      expect(screen.getByTestId('workflow-stepper')).toBeInTheDocument();
    });
  });
});
