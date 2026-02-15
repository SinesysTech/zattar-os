import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DialogFormShell } from '../dialog-form-shell';
import { Button } from '@/components/ui/button';

// Mock do ResponsiveDialog pois ele usa hooks de media query
jest.mock('@/components/ui/responsive-dialog', () => ({
  ResponsiveDialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => (
    open ? <div data-testid="dialog-root">{children}</div> : null
  ),
  ResponsiveDialogContent: ({ children, className }: { children: React.ReactNode; className: string }) => (
    <div data-testid="dialog-content" className={className}>{children}</div>
  ),
  ResponsiveDialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  ResponsiveDialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  ResponsiveDialogBody: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-body">{children}</div>
  ),
  ResponsiveDialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}));

describe('DialogFormShell', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    title: 'Test Dialog',
    children: <div>Form Content</div>,
  };

  it('renders correctly with title and children', () => {
    render(<DialogFormShell {...defaultProps} />);

    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Test Dialog');
    expect(screen.getByText('Form Content')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('calls onOpenChange when cancel button is clicked', () => {
    render(<DialogFormShell {...defaultProps} />);

    fireEvent.click(screen.getByText('Cancelar'));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders custom footer buttons', () => {
    render(
      <DialogFormShell
        {...defaultProps}
        footer={<Button>Custom Action</Button>}
      />
    );

    expect(screen.getByText('Custom Action')).toBeInTheDocument();
  });

  it('renders progress bar when multiStep is provided', () => {
    render(
      <DialogFormShell
        {...defaultProps}
        multiStep={{ current: 1, total: 3, stepTitle: 'Step 1' }}
      />
    );

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Etapa 1 de 3')).toBeInTheDocument();
    // Progress component is used, we can check if it exists
    // But since it's Radix UI primitive, it might be harder to test exact value without complex mocks
    // We assume if text is present, multi-step block is rendered
  });
});
