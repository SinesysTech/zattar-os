import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { RevisarDocumentoClient } from "../client-page";

// ─── Mocks ────────────────────────────────────────────────────────────

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockActionGetDocumento = jest.fn();
const mockUsePresignedPdfUrl = jest.fn();
jest.mock("../../../../feature", () => ({
  actionGetDocumento: (...args: unknown[]) => mockActionGetDocumento(...args),
  usePresignedPdfUrl: (...args: unknown[]) => mockUsePresignedPdfUrl(...args),
  PdfPreviewDynamic: (props: Record<string, unknown>) => (
    <div data-testid="pdf-preview">PDF Preview Mock</div>
  ),
}));

const mockActionFinalizeDocumento = jest.fn();
jest.mock("../../../../feature/actions/documentos-actions", () => ({
  actionFinalizeDocumento: (...args: unknown[]) =>
    mockActionFinalizeDocumento(...args),
}));

jest.mock("../../../../feature/components/flow", () => ({
  DocumentFlowShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="document-flow-shell">{children}</div>
  ),
}));

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    get success() {
      return mockToastSuccess;
    },
    get error() {
      return mockToastError;
    },
  },
}));

// ─── Mock Data ────────────────────────────────────────────────────────

const mockDocumento = {
  documento: {
    id: 1,
    documento_uuid: "test-uuid-123",
    titulo: "Contrato de Prestação de Serviços",
    status: "pronto",
    selfie_habilitada: true,
    pdf_original_url: "https://storage.example.com/doc.pdf",
  },
  assinantes: [
    {
      id: 1,
      assinante_tipo: "cliente",
      dados_snapshot: { nome_completo: "João Silva" },
      token: "token-abc",
      public_link: "/assinar/token-abc",
      status: "pendente" as const,
    },
    {
      id: 2,
      assinante_tipo: "parte_contraria",
      dados_snapshot: { nome_completo: "Maria Santos" },
      token: "token-def",
      public_link: "/assinar/token-def",
      status: "concluido" as const,
    },
  ],
  ancoras: [
    {
      id: 1,
      documento_assinante_id: 1,
      tipo: "assinatura" as const,
      pagina: 1,
      x_norm: 0.1,
      y_norm: 0.8,
      w_norm: 0.3,
      h_norm: 0.05,
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────

function setupSuccessfulLoad() {
  mockActionGetDocumento.mockResolvedValue({
    success: true,
    data: mockDocumento,
  });
  mockUsePresignedPdfUrl.mockReturnValue({
    presignedUrl: "https://cdn.example.com/presigned-test.pdf",
  });
}

async function renderAndWaitForLoad(uuid = "test-uuid-123") {
  await act(async () => {
    render(<RevisarDocumentoClient uuid={uuid} />);
  });

  await waitFor(() => {
    expect(
      screen.queryByText("Contrato de Prestação de Serviços")
    ).toBeInTheDocument();
  });
}

// ─── Tests ────────────────────────────────────────────────────────────

describe("RevisarDocumentoClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePresignedPdfUrl.mockReturnValue({ presignedUrl: null });

    // clipboard mock
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  // ── 1. Renderização básica ─────────────────────────────────────────

  describe("Renderização básica", () => {
    beforeEach(() => {
      setupSuccessfulLoad();
    });

    it("deve renderizar o FlowShell", async () => {
      await renderAndWaitForLoad();
      expect(screen.getByTestId("document-flow-shell")).toBeInTheDocument();
    });

    it("deve mostrar o título do documento", async () => {
      await renderAndWaitForLoad();
      expect(
        screen.getByText("Contrato de Prestação de Serviços")
      ).toBeInTheDocument();
    });

    it("deve mostrar o badge de status", async () => {
      await renderAndWaitForLoad();
      expect(screen.getByText("Pronto")).toBeInTheDocument();
    });

    it("deve mostrar a strip de estatísticas com contagem de assinantes", async () => {
      await renderAndWaitForLoad();

      expect(screen.getByText("Assinantes")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("deve mostrar a contagem de âncoras", async () => {
      await renderAndWaitForLoad();

      expect(screen.getByText("Âncoras")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("deve mostrar a contagem de pendentes", async () => {
      await renderAndWaitForLoad();

      expect(screen.getByText("Pendentes")).toBeInTheDocument();
    });

    it("deve mostrar a contagem de concluídos quando houver", async () => {
      await renderAndWaitForLoad();

      expect(screen.getByText("Concluídos")).toBeInTheDocument();
    });

    it("não deve mostrar 'Concluídos' quando nenhum assinante concluiu", async () => {
      const allPendentes = {
        ...mockDocumento,
        assinantes: mockDocumento.assinantes.map((a) => ({
          ...a,
          status: "pendente" as const,
        })),
      };
      mockActionGetDocumento.mockResolvedValue({
        success: true,
        data: allPendentes,
      });
      mockUsePresignedPdfUrl.mockReturnValue({ presignedUrl: null });

      await act(async () => {
        render(<RevisarDocumentoClient uuid="test-uuid-123" />);
      });

      await waitFor(() => {
        expect(screen.getByText("Assinantes")).toBeInTheDocument();
      });

      expect(screen.queryByText("Concluídos")).not.toBeInTheDocument();
    });

    it("deve mostrar o banner de selfie quando habilitada", async () => {
      await renderAndWaitForLoad();

      expect(
        screen.getByText("Selfie de verificação")
      ).toBeInTheDocument();
      expect(
        screen.getByText("habilitada para este documento")
      ).toBeInTheDocument();
    });

    it("não deve mostrar o banner de selfie quando desabilitada", async () => {
      mockActionGetDocumento.mockResolvedValue({
        success: true,
        data: {
          ...mockDocumento,
          documento: {
            ...mockDocumento.documento,
            selfie_habilitada: false,
          },
        },
      });

      await act(async () => {
        render(<RevisarDocumentoClient uuid="test-uuid-123" />);
      });

      await waitFor(() => {
        expect(
          screen.queryByText("Contrato de Prestação de Serviços")
        ).toBeInTheDocument();
      });

      expect(
        screen.queryByText("Selfie de verificação")
      ).not.toBeInTheDocument();
    });

    it("deve renderizar o componente PdfPreviewDynamic", async () => {
      await renderAndWaitForLoad();
      expect(screen.getByTestId("pdf-preview")).toBeInTheDocument();
    });

    it("deve exibir 'Documento sem título' quando titulo é null", async () => {
      mockActionGetDocumento.mockResolvedValue({
        success: true,
        data: {
          ...mockDocumento,
          documento: { ...mockDocumento.documento, titulo: null },
        },
      });
      mockUsePresignedPdfUrl.mockReturnValue({ presignedUrl: null });

      await act(async () => {
        render(<RevisarDocumentoClient uuid="test-uuid-123" />);
      });

      await waitFor(() => {
        expect(
          screen.getByText("Documento sem título")
        ).toBeInTheDocument();
      });
    });
  });

  // ── 2. Links de assinatura ─────────────────────────────────────────

  describe("Links de assinatura", () => {
    beforeEach(() => {
      setupSuccessfulLoad();
    });

    it("deve renderizar um card para cada assinante", async () => {
      await renderAndWaitForLoad();

      expect(screen.getByText("João Silva")).toBeInTheDocument();
      expect(screen.getByText("Maria Santos")).toBeInTheDocument();
    });

    it("deve mostrar nome do assinante no card", async () => {
      await renderAndWaitForLoad();

      expect(screen.getByText("João Silva")).toBeInTheDocument();
      expect(screen.getByText("Maria Santos")).toBeInTheDocument();
    });

    it("deve mostrar tipo do assinante", async () => {
      await renderAndWaitForLoad();

      expect(screen.getByText(/cliente/i)).toBeInTheDocument();
      expect(screen.getByText(/parte contrária/i)).toBeInTheDocument();
    });

    it("deve mostrar indicação de assinado para assinante concluído", async () => {
      await renderAndWaitForLoad();

      // Maria Santos tem status concluido, deve mostrar " · Assinado"
      expect(screen.getByText(/assinado/i)).toBeInTheDocument();
    });

    it("deve exibir botões de copiar link e abrir link para cada assinante", async () => {
      await renderAndWaitForLoad();

      const copyButtons = screen.getAllByRole("button", {
        name: /copiar link/i,
      });
      expect(copyButtons).toHaveLength(2);

      const openLinks = screen.getAllByRole("link", { name: /abrir link/i });
      expect(openLinks).toHaveLength(2);
    });

    it("deve apontar link externo para o public_link correto", async () => {
      await renderAndWaitForLoad();

      const openLinks = screen.getAllByRole("link", { name: /abrir link/i });
      expect(openLinks[0]).toHaveAttribute("href", "/assinar/token-abc");
      expect(openLinks[1]).toHaveAttribute("href", "/assinar/token-def");
    });

    it("deve mostrar botão 'Copiar Todos'", async () => {
      await renderAndWaitForLoad();

      expect(
        screen.getByRole("button", { name: /copiar todos/i })
      ).toBeInTheDocument();
    });
  });

  // ── 3. Interações ──────────────────────────────────────────────────

  describe("Interações", () => {
    beforeEach(() => {
      setupSuccessfulLoad();
    });

    it("deve copiar link individual ao clicar no botão copiar", async () => {
      await renderAndWaitForLoad();

      const copyButtons = screen.getAllByRole("button", {
        name: /copiar link/i,
      });

      await act(async () => {
        fireEvent.click(copyButtons[0]);
      });

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          "http://localhost/assinar/token-abc"
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Link copiado para João Silva"
      );
    });

    it("deve copiar todos os links ao clicar em 'Copiar Todos'", async () => {
      await renderAndWaitForLoad();

      const copyAllBtn = screen.getByRole("button", {
        name: /copiar todos/i,
      });

      await act(async () => {
        fireEvent.click(copyAllBtn);
      });

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining("João Silva")
        );
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining("Maria Santos")
        );
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining("http://localhost/assinar/token-abc")
        );
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining("http://localhost/assinar/token-def")
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Todos os links foram copiados!"
      );
    });

    it("deve navegar para edição ao clicar em 'Voltar para Edição'", async () => {
      await renderAndWaitForLoad();

      const backBtn = screen.getByRole("button", {
        name: /voltar para edição/i,
      });

      fireEvent.click(backBtn);

      expect(mockPush).toHaveBeenCalledWith(
        "/app/assinatura-digital/documentos/editar/test-uuid-123"
      );
    });

    it("deve chamar actionFinalizeDocumento ao clicar em 'Finalizar e Enviar'", async () => {
      mockActionFinalizeDocumento.mockResolvedValue({ success: true });

      await renderAndWaitForLoad();

      const finalizeBtn = screen.getByRole("button", {
        name: /finalizar e enviar/i,
      });

      await act(async () => {
        fireEvent.click(finalizeBtn);
      });

      await waitFor(() => {
        expect(mockActionFinalizeDocumento).toHaveBeenCalledWith({
          uuid: "test-uuid-123",
        });
      });
    });

    it("deve exibir estado de loading enquanto finaliza", async () => {
      mockActionFinalizeDocumento.mockReturnValue(new Promise(() => {}));

      await renderAndWaitForLoad();

      const finalizeBtn = screen.getByRole("button", {
        name: /finalizar e enviar/i,
      });

      await act(async () => {
        fireEvent.click(finalizeBtn);
      });

      await waitFor(() => {
        expect(screen.getByText("Finalizando...")).toBeInTheDocument();
      });
    });

    it("deve redirecionar para a lista após finalizar com sucesso", async () => {
      mockActionFinalizeDocumento.mockResolvedValue({ success: true });

      await renderAndWaitForLoad();

      const finalizeBtn = screen.getByRole("button", {
        name: /finalizar e enviar/i,
      });

      await act(async () => {
        fireEvent.click(finalizeBtn);
      });

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(
          "Documento pronto para assinatura! Os links foram gerados."
        );
        expect(mockPush).toHaveBeenCalledWith(
          "/app/assinatura-digital/documentos/lista"
        );
      });
    });

    it("deve exibir toast de erro quando finalização retornar erro", async () => {
      mockActionFinalizeDocumento.mockResolvedValue({
        success: false,
        error: "Documento inválido",
      });

      await renderAndWaitForLoad();

      const finalizeBtn = screen.getByRole("button", {
        name: /finalizar e enviar/i,
      });

      await act(async () => {
        fireEvent.click(finalizeBtn);
      });

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Documento inválido");
      });
    });

    it("deve exibir toast de erro quando finalização lançar exceção", async () => {
      mockActionFinalizeDocumento.mockRejectedValue(
        new Error("Network error")
      );

      await renderAndWaitForLoad();

      const finalizeBtn = screen.getByRole("button", {
        name: /finalizar e enviar/i,
      });

      await act(async () => {
        fireEvent.click(finalizeBtn);
      });

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Network error");
      });
    });

    it("deve exibir toast de erro quando copiar link individual falhar", async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(
        new Error("Clipboard error")
      );

      await renderAndWaitForLoad();

      const copyButtons = screen.getAllByRole("button", {
        name: /copiar link/i,
      });

      await act(async () => {
        fireEvent.click(copyButtons[0]);
      });

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Erro ao copiar link");
      });
    });

    it("deve exibir toast de erro quando copiar todos os links falhar", async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(
        new Error("Clipboard error")
      );

      await renderAndWaitForLoad();

      const copyAllBtn = screen.getByRole("button", {
        name: /copiar todos/i,
      });

      await act(async () => {
        fireEvent.click(copyAllBtn);
      });

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Erro ao copiar links");
      });
    });
  });

  // ── 4. Loading e erros ─────────────────────────────────────────────

  describe("Loading e erros", () => {
    it("deve mostrar loading spinner enquanto carrega", async () => {
      // Nunca resolve para manter loading
      mockActionGetDocumento.mockReturnValue(new Promise(() => {}));
      mockUsePresignedPdfUrl.mockReturnValue({ presignedUrl: null });

      await act(async () => {
        render(<RevisarDocumentoClient uuid="test-uuid-123" />);
      });

      expect(screen.getByTestId("document-flow-shell")).toBeInTheDocument();
      // Loader2 e renderizado como SVG com animate-spin
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("deve redirecionar para lista quando documento não é encontrado", async () => {
      mockActionGetDocumento.mockResolvedValue({
        success: true,
        data: { documento: null, assinantes: [], ancoras: [] },
      });

      await act(async () => {
        render(<RevisarDocumentoClient uuid="test-uuid-123" />);
      });

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          "Documento não encontrado"
        );
        expect(mockPush).toHaveBeenCalledWith(
          "/app/assinatura-digital/documentos/lista"
        );
      });
    });

    it("deve mostrar toast de erro quando actionGetDocumento falha com mensagem", async () => {
      mockActionGetDocumento.mockResolvedValue({
        success: false,
        error: "Não autorizado",
      });

      await act(async () => {
        render(<RevisarDocumentoClient uuid="test-uuid-123" />);
      });

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Não autorizado");
        expect(mockPush).toHaveBeenCalledWith(
          "/app/assinatura-digital/documentos/lista"
        );
      });
    });

    it("deve mostrar toast de erro padrão quando actionGetDocumento falha sem mensagem", async () => {
      mockActionGetDocumento.mockResolvedValue({
        success: false,
        error: undefined,
      });

      await act(async () => {
        render(<RevisarDocumentoClient uuid="test-uuid-123" />);
      });

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          "Erro ao carregar documento"
        );
      });
    });

    it("deve mostrar toast de erro e redirecionar quando actionGetDocumento lança exceção", async () => {
      mockActionGetDocumento.mockRejectedValue(new Error("Server error"));

      await act(async () => {
        render(<RevisarDocumentoClient uuid="test-uuid-123" />);
      });

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          "Erro ao carregar documento"
        );
        expect(mockPush).toHaveBeenCalledWith(
          "/app/assinatura-digital/documentos/lista"
        );
      });
    });
  });

  // ── 5. Acessibilidade ─────────────────────────────────────────────

  describe("Acessibilidade", () => {
    beforeEach(() => {
      setupSuccessfulLoad();
    });

    it("deve ter sr-only labels nos botões de copiar link", async () => {
      await renderAndWaitForLoad();

      const srOnlyLabels = screen.getAllByText("Copiar link");
      srOnlyLabels.forEach((label) => {
        expect(label).toHaveClass("sr-only");
      });
    });

    it("deve ter sr-only labels nos botões de abrir link", async () => {
      await renderAndWaitForLoad();

      const srOnlyLabels = screen.getAllByText("Abrir link");
      srOnlyLabels.forEach((label) => {
        expect(label).toHaveClass("sr-only");
      });
    });

    it('links externos devem ter rel="noopener noreferrer"', async () => {
      await renderAndWaitForLoad();

      const openLinks = screen.getAllByRole("link", { name: /abrir link/i });
      openLinks.forEach((link) => {
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      });
    });

    it('links externos devem ter target="_blank"', async () => {
      await renderAndWaitForLoad();

      const openLinks = screen.getAllByRole("link", { name: /abrir link/i });
      openLinks.forEach((link) => {
        expect(link).toHaveAttribute("target", "_blank");
      });
    });
  });
});
