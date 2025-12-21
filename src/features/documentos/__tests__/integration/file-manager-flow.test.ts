import { describe, it, expect, vi, beforeEach } from "vitest";
import * as service from "../../service";
import * as repository from "../../repository";
import { authenticateRequest } from "@/lib/auth/session";

// Mock dependencies
vi.mock("@/lib/storage/backblaze-b2.service", () => ({
  generatePresignedUrl: vi.fn(),
  uploadFileToB2: vi.fn(),
  generatePresignedUploadUrl: vi.fn(),
  getTipoMedia: vi.fn(),
  validateFileType: vi.fn(),
  validateFileSize: vi.fn(),
}));

vi.mock("../../repository", () => ({
  listarItensUnificados: vi.fn(),
  listarPastasComContadores: vi.fn(),
  buscarCaminhoPasta: vi.fn(),
  verificarAcessoPasta: vi.fn(),
}));

vi.mock("../../service", async (importOriginal) => {
  const actual = await importOriginal<typeof service>();
  return {
    ...actual,
    // We only mock what we intentionally want to test in isolation if needed,
    // but here we want to test service logic that calls repository.
    // So we might NOT want to mock service methods if we are testing service integration.
    // Integration tests usually mock the DB/Repository layer.
  };
});

describe("File Manager Flow Integration", () => {
  const mockUser = { id: 123, email: "test@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list items without forcing criado_por filter", async () => {
    // Setup
    const params = { limit: 10, offset: 0 };
    (repository.listarItensUnificados as any).mockResolvedValue({
      itens: [],
      total: 0,
    });

    // Act
    await service.listarItensUnificados(params, mockUser.id);

    // Assert
    expect(repository.listarItensUnificados).toHaveBeenCalledWith(params);
    expect(repository.listarItensUnificados).not.toHaveBeenCalledWith(
      expect.objectContaining({
        criado_por: mockUser.id,
      })
    );
  });

  it("should fetch breadcrumbs with access check", async () => {
    // Setup
    const pastaId = 5;
    (repository.verificarAcessoPasta as any).mockResolvedValue(true);
    (repository.buscarCaminhoPasta as any).mockResolvedValue([
      { id: 1, nome: "Root" },
      { id: 5, nome: "Current" },
    ]);

    // Act
    const breadcrumbs = await service.buscarCaminhoPasta(pastaId, mockUser.id);

    // Assert
    expect(repository.verificarAcessoPasta).toHaveBeenCalledWith(
      pastaId,
      mockUser.id
    );
    expect(repository.buscarCaminhoPasta).toHaveBeenCalledWith(pastaId);
    expect(breadcrumbs).toHaveLength(2);
    expect(breadcrumbs[1].nome).toBe("Current");
  });

  it("should throw error if user has no access to folder for breadcrumbs", async () => {
    // Setup
    const pastaId = 99;
    (repository.verificarAcessoPasta as any).mockResolvedValue(false);

    // Act & Assert
    await expect(
      service.buscarCaminhoPasta(pastaId, mockUser.id)
    ).rejects.toThrow("Acesso negado à pasta");

    expect(repository.buscarCaminhoPasta).not.toHaveBeenCalled();
  });
});
