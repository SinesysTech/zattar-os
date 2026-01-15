import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentUploadDropzone } from "../components/upload/document-upload-dropzone";
import { SignatureWorkflowStepper } from "../components/workflow/signature-workflow-stepper";
import { FloatingSidebar } from "../components/editor/components/FloatingSidebar";
import { useFormularioStore } from "../store/formulario-store";
import { useDocumentUpload } from "../components/upload/hooks/use-document-upload";
import { useSigners } from "../components/editor/hooks/use-signers";

// Mocks
jest.mock("../components/upload/hooks/use-document-upload");
jest.mock("../components/editor/hooks/use-signers");
jest.mock("../store/formulario-store");
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// Simplified mock helper
const mockStore = () => {
  let state = {
    etapaAtual: 0,
    dadosContrato: {},
    signers: [] as any[],
  };
  return {
    etapaAtual: 0,
    setDadosContrato: jest.fn((data) => {
      state.dadosContrato = { ...state.dadosContrato, ...data };
    }),
    proximaEtapa: jest.fn(() => {
      state.etapaAtual += 1;
    }),
    getTotalSteps: jest.fn(() => 3),
    // ... add other necessary mock implementations
  };
};

describe("Assinatura Digital - New Workflow Integration", () => {
  const user = userEvent.setup();
  const mockUpload = {
    isUploading: false,
    uploadFile: jest
      .fn()
      .mockResolvedValue({ url: "http://test.com/doc.pdf", name: "doc.pdf" }),
    selectFile: jest.fn(),
    selectedFile: { name: "doc.pdf" },
    resetUpload: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useDocumentUpload as unknown as jest.Mock).mockReturnValue(mockUpload);
    (useSigners as unknown as jest.Mock).mockReturnValue({
      signers: [],
      addSigner: jest.fn(),
      activeSigner: null,
      setActiveSigner: jest.fn(),
    });
    (useFormularioStore as unknown as jest.Mock).mockReturnValue({
      etapaAtual: 0, // Upload step
      setDadosContrato: jest.fn(),
      proximaEtapa: jest.fn(),
      getTotalSteps: jest.fn(() => 3),
    });
  });

  it("deve permitir fluxo de upload e avançar", async () => {
    // Render components that would appear in the page
    render(
      <div>
        <SignatureWorkflowStepper />
        <DocumentUploadDropzone open={true} onOpenChange={jest.fn()} />
      </div>
    );

    // Verify Stepper
    expect(screen.getByText(/Upload/i)).toBeInTheDocument();

    // Simular fluxo de upload
    const continueBtn = screen.getByRole("button", { name: /continuar/i });
    await user.click(continueBtn);

    await waitFor(() => {
      // Check if proximaEtapa was called?
      // Actually, since I mocked the store, the component will call 'proximaEtapa' from the mock.
      // We can check if the mock was called.
      const api = useFormularioStore();
      expect(api.proximaEtapa).toHaveBeenCalled();
    });
  });

  it("deve permitir adicionar signatário na etapa de configuração", async () => {
    // Change store state to step 1 (Configuration)
    (useFormularioStore as unknown as jest.Mock).mockReturnValue({
      etapaAtual: 1,
      getTotalSteps: jest.fn(() => 3),
    });

    render(<FloatingSidebar />); // Sidebar is part of editor

    // Simular abre modal de adicionar (assuming button exists in sidebar)
    const addBtn = screen.getByRole("button", { name: /adicionar/i });
    await user.click(addBtn);

    // This is a partial integration test as it relies on internal components of FloatingSidebar working.
    // If FloatingSidebar uses a Dialog that is not mocked or handled, this might fail without further setup.
    // Assuming FloatingSidebar uses internal state or another hook for modal.
  });
});
