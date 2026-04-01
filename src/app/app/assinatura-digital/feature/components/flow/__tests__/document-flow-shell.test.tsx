import { render, screen, fireEvent } from "@testing-library/react";
import { DocumentFlowShell } from "../document-flow-shell";

// ─── Mocks ────────────────────────────────────────────────────────────

const mockPush = jest.fn();
let mockPathname = "/app/assinatura-digital/documentos/novo";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock("@/components/ui/progress", () => ({
  Progress: ({
    value,
    className,
    "aria-label": ariaLabel,
  }: {
    value: number;
    className?: string;
    "aria-label"?: string;
  }) => (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-label={ariaLabel}
      className={className}
      data-testid="progress-bar"
    />
  ),
}));

// ─── Helpers ──────────────────────────────────────────────────────────

function renderShell(props: { fullHeight?: boolean; children?: React.ReactNode } = {}) {
  const { children = <div data-testid="child-content">Conteudo</div>, ...rest } = props;
  return render(<DocumentFlowShell {...rest}>{children}</DocumentFlowShell>);
}

// ─── Tests ────────────────────────────────────────────────────────────

describe("DocumentFlowShell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/app/assinatura-digital/documentos/novo";
  });

  // ── Renderizacao ──────────────────────────────────────────────────

  describe("Renderizacao", () => {
    it("deve renderizar os filhos corretamente", () => {
      renderShell();
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
      expect(screen.getByText("Conteudo")).toBeInTheDocument();
    });

    it("deve renderizar o stepper com as 3 etapas", () => {
      renderShell();
      expect(screen.getAllByText("Enviar").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Configurar").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Revisar").length).toBeGreaterThanOrEqual(1);
    });

    it("deve exibir o botao Voltar", () => {
      renderShell();
      expect(screen.getByText("Voltar")).toBeInTheDocument();
    });

    it("deve renderizar separadores entre os steps", () => {
      renderShell();
      // Separadores sao divs com classes h-0.5 e aria-hidden
      const separators = document.querySelectorAll("div.h-0\\.5[aria-hidden='true']");
      // 2 separadores entre 3 steps
      expect(separators.length).toBe(2);
    });
  });

  // ── Deteccao de etapa pela rota ───────────────────────────────────

  describe("Deteccao de etapa pela rota", () => {
    it("deve detectar etapa 0 (Upload) quando a URL contem /novo", () => {
      mockPathname = "/app/assinatura-digital/documentos/novo";
      renderShell();

      const stepDots = document.querySelectorAll('[aria-current="step"]');
      expect(stepDots).toHaveLength(1);

      // O sr-only deve indicar Etapa 1 de 3
      const srOnly = document.querySelector("[aria-live='polite']");
      expect(srOnly).toHaveTextContent("Etapa 1 de 3");
      expect(srOnly).toHaveTextContent("Enviar");
    });

    it("deve detectar etapa 1 (Configurar) quando a URL contem /editar", () => {
      mockPathname = "/app/assinatura-digital/documentos/editar/some-uuid";
      renderShell();

      const stepDots = document.querySelectorAll('[aria-current="step"]');
      expect(stepDots).toHaveLength(1);

      const srOnly = document.querySelector("[aria-live='polite']");
      expect(srOnly).toHaveTextContent("Etapa 2 de 3");
      expect(srOnly).toHaveTextContent("Configurar");
    });

    it("deve detectar etapa 2 (Revisar) quando a URL contem /revisar", () => {
      mockPathname = "/app/assinatura-digital/documentos/revisar/some-uuid";
      renderShell();

      const stepDots = document.querySelectorAll('[aria-current="step"]');
      expect(stepDots).toHaveLength(1);

      const srOnly = document.querySelector("[aria-live='polite']");
      expect(srOnly).toHaveTextContent("Etapa 3 de 3");
      expect(srOnly).toHaveTextContent("Revisar");
    });

    it("deve usar etapa 0 como padrao para caminhos desconhecidos", () => {
      mockPathname = "/app/assinatura-digital/documentos/outro";
      renderShell();

      const srOnly = document.querySelector("[aria-live='polite']");
      expect(srOnly).toHaveTextContent("Etapa 1 de 3");
    });
  });

  // ── Estados visuais dos steps ─────────────────────────────────────

  describe("Estados visuais dos steps", () => {
    it("deve marcar o step atual com aria-current=step", () => {
      mockPathname = "/app/assinatura-digital/documentos/editar/uuid";
      renderShell();

      const currentSteps = document.querySelectorAll('[aria-current="step"]');
      expect(currentSteps).toHaveLength(1);
    });

    it("deve aplicar estilo primario no step atual", () => {
      mockPathname = "/app/assinatura-digital/documentos/novo";
      renderShell();

      const currentStep = document.querySelector('[aria-current="step"]');
      expect(currentStep).toHaveClass("border-primary");
      expect(currentStep).toHaveClass("text-primary");
    });

    it("deve aplicar estilo completado nos steps anteriores ao atual", () => {
      mockPathname = "/app/assinatura-digital/documentos/revisar/uuid";
      renderShell();

      // Steps 0 e 1 devem estar completados (bg-primary)
      const allDots = document.querySelectorAll(".rounded-full");
      // Step 0 (Upload) - completado
      expect(allDots[0]).toHaveClass("bg-primary");
      expect(allDots[0]).toHaveClass("text-primary-foreground");
      // Step 1 (Configurar) - completado
      expect(allDots[1]).toHaveClass("bg-primary");
      expect(allDots[1]).toHaveClass("text-primary-foreground");
      // Step 2 (Revisar) - atual
      expect(allDots[2]).toHaveAttribute("aria-current", "step");
    });

    it("deve aplicar estilo muted nos steps pendentes", () => {
      mockPathname = "/app/assinatura-digital/documentos/novo";
      renderShell();

      const allDots = document.querySelectorAll(".rounded-full");
      // Steps 1 e 2 devem ter estilo pendente
      expect(allDots[1]).toHaveClass("text-muted-foreground");
      expect(allDots[1]).toHaveClass("border-border");
      expect(allDots[2]).toHaveClass("text-muted-foreground");
      expect(allDots[2]).toHaveClass("border-border");
    });

    it("deve colorir separadores de steps completados com cor primaria", () => {
      mockPathname = "/app/assinatura-digital/documentos/revisar/uuid";
      renderShell();

      const separators = document.querySelectorAll("div.h-0\\.5[aria-hidden='true']");
      // Ambos separadores antes do step 2 devem ser primarios
      expect(separators[0]).toHaveClass("bg-primary");
      expect(separators[1]).toHaveClass("bg-primary");
    });

    it("deve colorir separadores pendentes com cor border", () => {
      mockPathname = "/app/assinatura-digital/documentos/novo";
      renderShell();

      const separators = document.querySelectorAll("div.h-0\\.5[aria-hidden='true']");
      expect(separators[0]).toHaveClass("bg-border");
      expect(separators[1]).toHaveClass("bg-border");
    });
  });

  // ── Navegacao ─────────────────────────────────────────────────────

  describe("Navegacao", () => {
    it("deve navegar para a lista ao clicar no botao Voltar", () => {
      renderShell();

      const voltarButton = screen.getByText("Voltar").closest("button")!;
      fireEvent.click(voltarButton);

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith(
        "/app/assinatura-digital/documentos/lista"
      );
    });
  });

  // ── Acessibilidade ────────────────────────────────────────────────

  describe("Acessibilidade", () => {
    it("deve ter aria-label correto no stepper", () => {
      renderShell();

      const nav = screen.getByLabelText("Progresso do fluxo de assinatura");
      expect(nav).toBeInTheDocument();
      expect(nav.tagName).toBe("NAV");
    });

    it("deve exibir texto para leitores de tela com a etapa atual", () => {
      mockPathname = "/app/assinatura-digital/documentos/editar/uuid";
      renderShell();

      // O sr-only com aria-live deve conter o texto correto
      const srOnly = document.querySelector("[aria-live='polite']");
      expect(srOnly).toBeInTheDocument();
      expect(srOnly).toHaveTextContent("Etapa 2 de 3");
      expect(srOnly).toHaveAttribute("aria-live", "polite");
      expect(srOnly).toHaveAttribute("aria-atomic", "true");
    });

    it("deve incluir o label do step atual no texto para leitores de tela", () => {
      mockPathname = "/app/assinatura-digital/documentos/editar/uuid";
      renderShell();

      // Texto completo: "Etapa 2 de 3: Configurar"
      const srContainer = document.querySelector("[aria-live='polite']");
      expect(srContainer).toHaveTextContent("Etapa 2 de 3:");
      expect(srContainer).toHaveTextContent("Configurar");
    });

    it("deve ter o botao Voltar acessivel", () => {
      renderShell();

      const button = screen.getByText("Voltar").closest("button");
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  // ── Props ─────────────────────────────────────────────────────────

  describe("Props", () => {
    it("deve remover padding quando fullHeight=true", () => {
      renderShell({ fullHeight: true });

      const content = screen.getByTestId("child-content").parentElement!;
      expect(content).not.toHaveClass("p-6");
    });

    it("deve aplicar padding quando fullHeight=false (padrao)", () => {
      renderShell({ fullHeight: false });

      const content = screen.getByTestId("child-content").parentElement!;
      expect(content).toHaveClass("p-6");
    });

    it("deve aplicar padding por padrao quando fullHeight nao e informado", () => {
      renderShell();

      const content = screen.getByTestId("child-content").parentElement!;
      expect(content).toHaveClass("p-6");
    });

    it("deve aplicar layout full-height com -m-6", () => {
      const { container } = renderShell();

      const wrapper = container.firstElementChild!;
      expect(wrapper).toHaveClass("-m-6");
      expect(wrapper).toHaveClass("flex");
      expect(wrapper).toHaveClass("flex-col");
    });
  });

  // ── Mobile progress bar ───────────────────────────────────────────

  describe("Mobile progress bar", () => {
    it("deve renderizar a barra de progresso mobile", () => {
      renderShell();

      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toBeInTheDocument();
    });

    it("deve mostrar 0% de progresso na etapa de upload", () => {
      mockPathname = "/app/assinatura-digital/documentos/novo";
      renderShell();

      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "0");
    });

    it("deve mostrar 50% de progresso na etapa de configuracao", () => {
      mockPathname = "/app/assinatura-digital/documentos/editar/uuid";
      renderShell();

      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    });

    it("deve mostrar 100% de progresso na etapa de revisao", () => {
      mockPathname = "/app/assinatura-digital/documentos/revisar/uuid";
      renderShell();

      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "100");
    });

    it("deve exibir o label da etapa atual na barra mobile", () => {
      mockPathname = "/app/assinatura-digital/documentos/editar/uuid";
      renderShell();

      // Mobile progress shows step label
      const labels = screen.getAllByText("Configurar");
      expect(labels.length).toBeGreaterThanOrEqual(1);
    });
  });
});
