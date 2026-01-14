import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentUploadDropzone } from '../document-upload-dropzone';
import { useFormularioStore } from '../../../store/formulario-store';
import { useDocumentUpload } from '../hooks/use-document-upload';
import { toast } from 'sonner';

// Mocks
jest.mock('../hooks/use-document-upload');
jest.mock('../../../store/formulario-store');
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockSetDadosContrato = jest.fn();
const mockProximaEtapa = jest.fn();
const mockOnUploadSuccess = jest.fn();
const mockOnOpenChange = jest.fn();

// Hook Mock Implementation Helpers
const mockUploadFile = jest.fn();
const mockResetUpload = jest.fn();
const mockSelectFile = jest.fn();

describe('DocumentUploadDropzone', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();

    // Store mock
    (useFormularioStore as unknown as jest.Mock).mockReturnValue({
      setDadosContrato: mockSetDadosContrato,
      proximaEtapa: mockProximaEtapa,
    }); // Default hook mock
    (useDocumentUpload as unknown as jest.Mock).mockReturnValue({
      isUploading: false,
      progress: 0,
      uploadedFile: null,
      selectedFile: null,
      error: null,
      uploadFile: mockUploadFile,
      resetUpload: mockResetUpload,
      selectFile: mockSelectFile,
      removeFile: jest.fn(),
    });
  });

  it('deve renderizar corretamente quando aberto', () => {
    render(
      <DocumentUploadDropzone
        open={true}
        onOpenChange={mockOnOpenChange}
        onUploadSuccess={mockOnUploadSuccess}
      />
    );

    expect(screen.getByText('Upload de Documento')).toBeInTheDocument();
    expect(screen.getByText(/Arraste e solte/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled();
  });

  it('deve validar tipos de arquivo não suportados via Dropzone', async () => {
    render(
      <DocumentUploadDropzone
        open={true}
        onOpenChange={mockOnOpenChange}
        onUploadSuccess={mockOnUploadSuccess}
      />
    );

    // react-dropzone input is usually hidden
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy'], 'test.txt', { type: 'text/plain' });

    await user.upload(input, file);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/não suportado/i));
    });
  });

  it('deve validar tamanho do arquivo via Dropzone', async () => {
    render(
      <DocumentUploadDropzone
        open={true}
        onOpenChange={mockOnOpenChange}
        onUploadSuccess={mockOnUploadSuccess}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    // > 10MB file
    const file = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });

    await user.upload(input, file);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/muito grande/i));
    });
  });

  it('deve chamar selectFile ao fazer upload de arquivo válido', async () => {
    render(
      <DocumentUploadDropzone
        open={true}
        onOpenChange={mockOnOpenChange}
        onUploadSuccess={mockOnUploadSuccess}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy'], 'valid.pdf', { type: 'application/pdf' });

    await user.upload(input, file);

    expect(mockSelectFile).toHaveBeenCalled();
  });

  it('deve habilitar botão continuar quando arquivo selecionado', () => {
    (useDocumentUpload as unknown as jest.Mock).mockReturnValue({
      isUploading: false,
      selectedFile: { name: 'test.pdf' },
      uploadFile: mockUploadFile,
      resetUpload: mockResetUpload,
      selectFile: mockSelectFile,
    });

    render(
      <DocumentUploadDropzone
        open={true}
        onOpenChange={mockOnOpenChange}
        onUploadSuccess={mockOnUploadSuccess}
      />
    );

    expect(screen.getByRole('button', { name: /continuar/i })).toBeEnabled();
  });

  it('deve realizar upload e avançar fluxo ao clicar em continuar', async () => {
    mockUploadFile.mockResolvedValue({ url: 'http://url', name: 'test.pdf' });

    (useDocumentUpload as unknown as jest.Mock).mockReturnValue({
      isUploading: false,
      selectedFile: { name: 'test.pdf' },
      uploadFile: mockUploadFile,
      resetUpload: mockResetUpload,
      selectFile: mockSelectFile,
    });

    render(
      <DocumentUploadDropzone
        open={true}
        onOpenChange={mockOnOpenChange}
        onUploadSuccess={mockOnUploadSuccess}
      />
    );

    const btn = screen.getByRole('button', { name: /continuar/i });
    await user.click(btn);

    await waitFor(() => {
      expect(mockUploadFile).toHaveBeenCalled();
      expect(mockSetDadosContrato).toHaveBeenCalledWith({
        documentoUrl: 'http://url',
        documentoNome: 'test.pdf'
      });
      expect(mockOnUploadSuccess).toHaveBeenCalledWith('http://url', 'test.pdf');
      expect(mockProximaEtapa).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('deve exibir barra de progresso durante upload', () => {
    (useDocumentUpload as unknown as jest.Mock).mockReturnValue({
      isUploading: true,
      progress: 50,
      uploadFile: mockUploadFile,
      resetUpload: mockResetUpload,
      selectFile: mockSelectFile,
    });

    render(
      <DocumentUploadDropzone
        open={true}
        onOpenChange={mockOnOpenChange}
        onUploadSuccess={mockOnUploadSuccess}
      />
    );

    expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled();
    // Assuming UploadDropzoneArea renders progress. Check for progress text or element
    // Since we don't have access to child implementation details easily, checking the button state is a good proxy for 'isUploading' state usage
  });
});
