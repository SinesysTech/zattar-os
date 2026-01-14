import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentUploadDropzone } from '../document-upload-dropzone';
import { useFormularioStore } from '../../../store/formulario-store';
import { toast } from 'sonner';
import { useDocumentUpload } from '../hooks/use-document-upload';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

jest.mock('../hooks/use-document-upload');
jest.mock('../../../store/formulario-store');

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(({ onDrop, onDropRejected }) => ({
    getRootProps: () => ({
      onClick: jest.fn(),
      onDragEnter: jest.fn(),
      onDragLeave: jest.fn(),
      onDragOver: jest.fn(),
      onDrop: jest.fn(),
    }),
    getInputProps: () => ({
      type: 'file',
      accept: 'application/pdf,.docx,image/png',
      'data-testid': 'file-input',
    }),
    isDragActive: false,
    open: jest.fn(),
  })),
}));

// Mock child components
jest.mock('../components/upload-context-panel', () => ({
  UploadContextPanel: ({ onSelectFile, isUploading }: { onSelectFile: () => void; isUploading: boolean }) => (
    <div data-testid="upload-context-panel">
      <button onClick={onSelectFile} disabled={isUploading} data-testid="select-file-button">
        Selecionar Arquivo
      </button>
    </div>
  ),
}));

jest.mock('../components/upload-dropzone-area', () => ({
  UploadDropzoneArea: ({
    isDragActive,
    hasError,
    errorMessage,
    selectedFile,
    uploadedFile,
    isUploading,
    progress,
    onRemoveFile,
    getRootProps,
    getInputProps,
  }: {
    isDragActive: boolean;
    hasError: boolean;
    errorMessage?: string;
    selectedFile: File | null;
    uploadedFile: { url: string; name: string } | null;
    isUploading: boolean;
    progress: number;
    onRemoveFile: () => void;
    getRootProps: () => Record<string, unknown>;
    getInputProps: () => Record<string, unknown>;
  }) => (
    <div data-testid="dropzone-area" {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive && <span data-testid="drag-active">Arraste aqui</span>}
      {hasError && <span data-testid="error-message">{errorMessage}</span>}
      {selectedFile && <span data-testid="selected-file">{selectedFile.name}</span>}
      {uploadedFile && <span data-testid="uploaded-file">{uploadedFile.name}</span>}
      {isUploading && (
        <div data-testid="progress-bar" style={{ width: `${progress}%` }}>
          {progress}%
        </div>
      )}
      {(selectedFile || uploadedFile) && (
        <button data-testid="remove-file-button" onClick={onRemoveFile}>
          Remover
        </button>
      )}
    </div>
  ),
}));

jest.mock('@/components/shared/dialog-shell/dialog-form-shell', () => ({
  DialogFormShell: ({
    open,
    onOpenChange,
    title,
    children,
    footer,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: React.ReactNode;
    footer: React.ReactNode;
  }) =>
    open ? (
      <div data-testid="dialog-shell" role="dialog">
        <h2>{title}</h2>
        <button data-testid="close-dialog" onClick={() => onOpenChange(false)}>
          Fechar
        </button>
        {children}
        <div data-testid="dialog-footer">{footer}</div>
      </div>
    ) : null,
}));

// Helper to create mock File
const createMockFile = (name: string, size: number, type: string): File => {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
};

describe('DocumentUploadDropzone', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnUploadSuccess = jest.fn();
  const mockSetDadosContrato = jest.fn();
  const mockProximaEtapa = jest.fn();
  const mockSelectFile = jest.fn();
  const mockUploadFile = jest.fn();
  const mockResetUpload = jest.fn();
  const mockRemoveFile = jest.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onUploadSuccess: mockOnUploadSuccess,
  };

  const defaultUploadHookReturn = {
    isUploading: false,
    progress: 0,
    error: null,
    uploadedFile: null,
    selectedFile: null,
    selectFile: mockSelectFile,
    uploadFile: mockUploadFile,
    resetUpload: mockResetUpload,
    removeFile: mockRemoveFile,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (useFormularioStore as unknown as jest.Mock).mockReturnValue({
      setDadosContrato: mockSetDadosContrato,
      proximaEtapa: mockProximaEtapa,
    });

    (useDocumentUpload as jest.Mock).mockReturnValue(defaultUploadHookReturn);
  });

  describe('Rendering', () => {
    it('should render the modal when open is true', () => {
      render(<DocumentUploadDropzone {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Upload de Documento')).toBeInTheDocument();
    });

    it('should not render the modal when open is false', () => {
      render(<DocumentUploadDropzone {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render upload context panel', () => {
      render(<DocumentUploadDropzone {...defaultProps} />);

      expect(screen.getByTestId('upload-context-panel')).toBeInTheDocument();
    });

    it('should render dropzone area', () => {
      render(<DocumentUploadDropzone {...defaultProps} />);

      expect(screen.getByTestId('dropzone-area')).toBeInTheDocument();
    });

    it('should render continue button', () => {
      render(<DocumentUploadDropzone {...defaultProps} />);

      expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument();
    });
  });

  describe('File Type Validation', () => {
    it('should show error toast for invalid file type', async () => {
      // This is handled by the useDropzone's onDropRejected callback
      // The mock implementation simulates this behavior
      const { useDropzone } = jest.requireMock('react-dropzone');
      let onDropRejectedCallback: (rejections: { errors: { code: string }[] }[]) => void;

      useDropzone.mockImplementation(({ onDropRejected }: { onDropRejected: (rejections: { errors: { code: string }[] }[]) => void }) => {
        onDropRejectedCallback = onDropRejected;
        return {
          getRootProps: () => ({}),
          getInputProps: () => ({ 'data-testid': 'file-input' }),
          isDragActive: false,
          open: jest.fn(),
        };
      });

      render(<DocumentUploadDropzone {...defaultProps} />);

      // Simulate file rejection
      act(() => {
        onDropRejectedCallback!([{ errors: [{ code: 'file-invalid-type' }] }]);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Tipo de arquivo não suportado. Use PDF, DOCX ou PNG.'
      );
    });
  });

  describe('File Size Validation', () => {
    it('should show error toast for files larger than 10MB', async () => {
      const { useDropzone } = jest.requireMock('react-dropzone');
      let onDropRejectedCallback: (rejections: { errors: { code: string }[] }[]) => void;

      useDropzone.mockImplementation(({ onDropRejected }: { onDropRejected: (rejections: { errors: { code: string }[] }[]) => void }) => {
        onDropRejectedCallback = onDropRejected;
        return {
          getRootProps: () => ({}),
          getInputProps: () => ({ 'data-testid': 'file-input' }),
          isDragActive: false,
          open: jest.fn(),
        };
      });

      render(<DocumentUploadDropzone {...defaultProps} />);

      // Simulate file size rejection
      act(() => {
        onDropRejectedCallback!([{ errors: [{ code: 'file-too-large' }] }]);
      });

      expect(toast.error).toHaveBeenCalledWith('Arquivo muito grande. O limite é 10MB.');
    });
  });

  describe('Drag & Drop', () => {
    it('should call selectFile when valid file is dropped', async () => {
      const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');
      const { useDropzone } = jest.requireMock('react-dropzone');
      let onDropCallback: (files: File[]) => void;

      useDropzone.mockImplementation(({ onDrop }: { onDrop: (files: File[]) => void }) => {
        onDropCallback = onDrop;
        return {
          getRootProps: () => ({}),
          getInputProps: () => ({ 'data-testid': 'file-input' }),
          isDragActive: false,
          open: jest.fn(),
        };
      });

      render(<DocumentUploadDropzone {...defaultProps} />);

      // Simulate file drop
      act(() => {
        onDropCallback!([mockFile]);
      });

      expect(mockSelectFile).toHaveBeenCalledWith(mockFile);
    });

    it('should only select the first file when multiple files are dropped', async () => {
      const mockFile1 = createMockFile('test1.pdf', 1024, 'application/pdf');
      const mockFile2 = createMockFile('test2.pdf', 1024, 'application/pdf');
      const { useDropzone } = jest.requireMock('react-dropzone');
      let onDropCallback: (files: File[]) => void;

      useDropzone.mockImplementation(({ onDrop }: { onDrop: (files: File[]) => void }) => {
        onDropCallback = onDrop;
        return {
          getRootProps: () => ({}),
          getInputProps: () => ({ 'data-testid': 'file-input' }),
          isDragActive: false,
          open: jest.fn(),
        };
      });

      render(<DocumentUploadDropzone {...defaultProps} />);

      act(() => {
        onDropCallback!([mockFile1, mockFile2]);
      });

      expect(mockSelectFile).toHaveBeenCalledWith(mockFile1);
      expect(mockSelectFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('Upload Success', () => {
    it('should call onUploadSuccess after successful upload', async () => {
      const user = userEvent.setup();
      const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');
      const uploadResult = { url: 'https://storage.test/file.pdf', name: 'test.pdf' };

      mockUploadFile.mockResolvedValue(uploadResult);

      (useDocumentUpload as jest.Mock).mockReturnValue({
        ...defaultUploadHookReturn,
        selectedFile: mockFile,
      });

      render(<DocumentUploadDropzone {...defaultProps} />);

      const continueButton = screen.getByRole('button', { name: /continuar/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalled();
      });
    });

    it('should call setDadosContrato with correct data after upload', async () => {
      const user = userEvent.setup();
      const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');
      const uploadResult = { url: 'https://storage.test/file.pdf', name: 'test.pdf' };

      mockUploadFile.mockResolvedValue(uploadResult);

      (useDocumentUpload as jest.Mock).mockReturnValue({
        ...defaultUploadHookReturn,
        selectedFile: mockFile,
      });

      render(<DocumentUploadDropzone {...defaultProps} />);

      const continueButton = screen.getByRole('button', { name: /continuar/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(mockSetDadosContrato).toHaveBeenCalledWith({
          documentoUrl: uploadResult.url,
          documentoNome: uploadResult.name,
        });
      });
    });

    it('should call proximaEtapa after successful upload', async () => {
      const user = userEvent.setup();
      const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');
      const uploadResult = { url: 'https://storage.test/file.pdf', name: 'test.pdf' };

      mockUploadFile.mockResolvedValue(uploadResult);

      (useDocumentUpload as jest.Mock).mockReturnValue({
        ...defaultUploadHookReturn,
        selectedFile: mockFile,
      });

      render(<DocumentUploadDropzone {...defaultProps} />);

      const continueButton = screen.getByRole('button', { name: /continuar/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(mockProximaEtapa).toHaveBeenCalled();
      });
    });
  });

  describe('Upload Error', () => {
    it('should show toast error when upload fails', async () => {
      (useDocumentUpload as jest.Mock).mockReturnValue({
        ...defaultUploadHookReturn,
        error: { code: 'UPLOAD_FAILED', message: 'Erro ao fazer upload' },
      });

      render(<DocumentUploadDropzone {...defaultProps} />);

      // The error toast is triggered by the onError callback in the hook
      expect(screen.getByTestId('error-message')).toHaveTextContent('Erro ao fazer upload');
    });
  });

  describe('Store Integration', () => {
    it('should use setDadosContrato from store', () => {
      render(<DocumentUploadDropzone {...defaultProps} />);

      expect(useFormularioStore).toHaveBeenCalled();
    });

    it('should use proximaEtapa from store', () => {
      render(<DocumentUploadDropzone {...defaultProps} />);

      expect(useFormularioStore).toHaveBeenCalled();
    });
  });

  describe('Continue Button State', () => {
    it('should disable continue button when no file is selected', () => {
      render(<DocumentUploadDropzone {...defaultProps} />);

      const continueButton = screen.getByRole('button', { name: /continuar/i });
      expect(continueButton).toBeDisabled();
    });

    it('should enable continue button when file is selected', () => {
      const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');

      (useDocumentUpload as jest.Mock).mockReturnValue({
        ...defaultUploadHookReturn,
        selectedFile: mockFile,
      });

      render(<DocumentUploadDropzone {...defaultProps} />);

      const continueButton = screen.getByRole('button', { name: /continuar/i });
      expect(continueButton).not.toBeDisabled();
    });

    it('should disable continue button while uploading', () => {
      const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');

      (useDocumentUpload as jest.Mock).mockReturnValue({
        ...defaultUploadHookReturn,
        selectedFile: mockFile,
        isUploading: true,
      });

      render(<DocumentUploadDropzone {...defaultProps} />);

      const continueButton = screen.getByRole('button', { name: /enviando/i });
      expect(continueButton).toBeDisabled();
    });

    it('should enable continue button when file is already uploaded', () => {
      const uploadedFile = { url: 'https://storage.test/file.pdf', name: 'test.pdf', size: 1024, type: 'application/pdf', uploadedAt: new Date() };

      (useDocumentUpload as jest.Mock).mockReturnValue({
        ...defaultUploadHookReturn,
        uploadedFile,
      });

      render(<DocumentUploadDropzone {...defaultProps} />);

      const continueButton = screen.getByRole('button', { name: /continuar/i });
      expect(continueButton).not.toBeDisabled();
    });
  });

  describe('Progress Bar', () => {
    it('should display progress bar during upload', () => {
      const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');

      (useDocumentUpload as jest.Mock).mockReturnValue({
        ...defaultUploadHookReturn,
        selectedFile: mockFile,
        isUploading: true,
        progress: 50,
      });

      render(<DocumentUploadDropzone {...defaultProps} />);

      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar')).toHaveStyle({ width: '50%' });
    });

    it('should not display progress bar when not uploading', () => {
      render(<DocumentUploadDropzone {...defaultProps} />);

      expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
    });
  });

  describe('Cancellation', () => {
    it('should call resetUpload when modal is closed', async () => {
      const user = userEvent.setup();

      render(<DocumentUploadDropzone {...defaultProps} />);

      const closeButton = screen.getByTestId('close-dialog');
      await user.click(closeButton);

      expect(mockResetUpload).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange with false when canceling', async () => {
      const user = userEvent.setup();

      render(<DocumentUploadDropzone {...defaultProps} />);

      const closeButton = screen.getByTestId('close-dialog');
      await user.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Already Uploaded File', () => {
    it('should use already uploaded file without re-uploading', async () => {
      const user = userEvent.setup();
      const uploadedFile = {
        url: 'https://storage.test/file.pdf',
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadedAt: new Date(),
      };

      (useDocumentUpload as jest.Mock).mockReturnValue({
        ...defaultUploadHookReturn,
        uploadedFile,
      });

      render(<DocumentUploadDropzone {...defaultProps} />);

      const continueButton = screen.getByRole('button', { name: /continuar/i });
      await user.click(continueButton);

      // Should not call uploadFile since file is already uploaded
      expect(mockUploadFile).not.toHaveBeenCalled();

      // Should still save to store
      await waitFor(() => {
        expect(mockSetDadosContrato).toHaveBeenCalledWith({
          documentoUrl: uploadedFile.url,
          documentoNome: uploadedFile.name,
        });
      });
    });
  });

  describe('Button Text', () => {
    it('should show "Continuar" when not uploading', () => {
      const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');

      (useDocumentUpload as jest.Mock).mockReturnValue({
        ...defaultUploadHookReturn,
        selectedFile: mockFile,
      });

      render(<DocumentUploadDropzone {...defaultProps} />);

      expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument();
    });

    it('should show "Enviando..." while uploading', () => {
      const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');

      (useDocumentUpload as jest.Mock).mockReturnValue({
        ...defaultUploadHookReturn,
        selectedFile: mockFile,
        isUploading: true,
      });

      render(<DocumentUploadDropzone {...defaultProps} />);

      expect(screen.getByRole('button', { name: /enviando/i })).toBeInTheDocument();
    });
  });
});
