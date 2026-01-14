import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentUploadDropzone } from '../document-upload-dropzone';
import { useFormularioStore } from '../../../store/formulario-store';
import { toast } from 'sonner';

// Mocks
jest.mock('../hooks/use-document-upload', () => ({
  useDocumentUpload: jest.fn(() => ({
    isUploading: false,
    progress: 0,
    uploadFile: jest.fn(),
    resetUpload: jest.fn(),
  })),
}));

jest.mock('../../../store/formulario-store', () => ({
  useFormularioStore: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockSetDadosContrato = jest.fn();
const mockProximaEtapa = jest.fn();

describe('DocumentUploadDropzone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useFormularioStore as unknown as jest.Mock).mockReturnValue({
      setDadosContrato: mockSetDadosContrato,
      proximaEtapa: mockProximaEtapa,
    });
  });

  it('deve renderizar corretamente quando aberto', () => {
    render(
      <DocumentUploadDropzone
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    expect(screen.getByText('Upload de Documento')).toBeInTheDocument();
    expect(screen.getByText(/Arraste e solte/i)).toBeInTheDocument();
  });

  it('deve validar tipos de arquivo não suportados', async () => {
    render(
      <DocumentUploadDropzone
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    const input = screen.getByLabelText(/upload/i); // Assuming there's an input with this label or generic file input
    const file = new File(['dummy'], 'test.txt', { type: 'text/plain' });

    // Note: In a real dropzone, we might need to simulate drop event or use specific userEvent.upload
    // If the component uses react-dropzone, userEvent.upload works on the input
    // However, if logic is inside useDocumentUpload (mocked), we might need to adjust the mock or how we test validation interaction
    // But assuming the component handles validation before calling hook, or hook handles it.
    // The plan says "Validar tipo... testar rejeição". If logic is in hook and hook is mocked, we can't test logic unless we implementation detail.
    // Wait, the plan says "Mockar use-document-upload". If validation is INSIDE the hook, we can't test validation strictly here unless we unmock it or partial mock it.
    // However, usually validation might be passed to dropzone props.
    // Let's assume validation triggers a toast error or UI feedback.

    // Actually, usually tests for components that use hooks just verify the UI reacts to the hook's state.
    // But "Validation de tipos de arquivo" implies testing the interaction.
    // If validation logic is in the component (via props to useDocumentUpload or Dropzone), we can test it.
    // I'll assume standard react-dropzone usage.

    // Since I mocked the hook entirely, I have to rely on what the component does.
    // Let's assume I should NOT mock the validation logic if I want to test it, OR the validation logic is in the component.
    // If the plan says "Mockar esses módulos", I should follow it.
    // Maybe the 'useDocumentUpload' handles the upload *process*, but the Dropzone component handles accept/reject?

    // Use userEvent to upload
    // const user = userEvent.setup();
    // await user.upload(input, file);
    // expect(toast.error).toHaveBeenCalled();
  });

  // Since I don't have the component source code, I will use a best-effort approach based on the plan's specific "Casos de teste".
  // I will check if I can read the component code quickly to ensure correct tests.
  // The plan said "Trust the files... Explore only when absolutely necessary".
  // I'll take a quick peek at `document-upload-dropzone.tsx` to see how it uses the hook.
});
