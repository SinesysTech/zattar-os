import {
  criarAudiencia,
  atualizarAudiencia,
  atualizarStatusAudiencia,
} from "../../service";
import * as repo from "../../repository";
import {
  StatusAudiencia,
  ModalidadeAudiencia,
  PresencaHibrida,
  CreateAudienciaInput,
  UpdateAudienciaInput,
} from "../../domain";

// Mock repository
jest.mock("../../repository");

// Helper for result types since we can't import ok/err easily if they are missing
const ok = <T>(data: T) => ({ success: true as const, data });
// const err = <E>(error: E) => ({ success: false as const, error });

describe("Audiencias Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("criarAudiencia", () => {
    const validAudiencia = {
      processoId: 1,
      tipoAudienciaId: 2,
      dataInicio: "2023-01-01T10:00:00Z",
      dataFim: "2023-01-01T11:00:00Z",
    };

    it("deve criar audiencia com sucesso", async () => {
      // Arrange
      (repo.processoExists as jest.Mock).mockResolvedValue(ok(true));
      (repo.tipoAudienciaExists as jest.Mock).mockResolvedValue(ok(true));
      (repo.saveAudiencia as jest.Mock).mockResolvedValue(
        ok({ id: 1, ...validAudiencia })
      );

      // Act
      const result = await criarAudiencia(validAudiencia as unknown as CreateAudienciaInput);

      // Assert
      expect(result.success).toBe(true);
      expect(repo.saveAudiencia).toHaveBeenCalled();
    });

    it("deve falhar se processo nao existir", async () => {
      // Arrange
      (repo.processoExists as jest.Mock).mockResolvedValue(ok(false));
      (repo.tipoAudienciaExists as jest.Mock).mockResolvedValue(ok(true));

      // Act
      const result = await criarAudiencia(validAudiencia as unknown as CreateAudienciaInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("deve falhar de validacao Zod", async () => {
      // Arrange
      const invalid = { ...validAudiencia };
      // @ts-expect-error forcing invalid input
      delete invalid.processoId;

      (repo.processoExists as jest.Mock).mockResolvedValue(ok(true));

      // Act
      const result = await criarAudiencia(invalid as unknown as CreateAudienciaInput);

      // Assert
      expect(result.success).toBe(false);
      expect(repo.saveAudiencia).not.toHaveBeenCalled();
    });
  });

  describe("atualizarAudiencia", () => {
    const existingAudiencia = { id: 1, processoId: 1 };

    it("deve atualizar com sucesso", async () => {
      // Arrange
      const updateData = { dataInicio: "2023-01-02T10:00:00Z" };
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(
        ok(existingAudiencia)
      );
      (repo.updateAudiencia as jest.Mock).mockResolvedValue(
        ok({ ...existingAudiencia, ...updateData })
      );

      // Act
      const result = await atualizarAudiencia(1, updateData as unknown as UpdateAudienciaInput);

      // Assert
      expect(result.success).toBe(true);
      expect(repo.updateAudiencia).toHaveBeenCalled();
    });

    it("deve falhar se audiencia nao existir", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok(null));
      const result = await atualizarAudiencia(99, {});
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe("NOT_FOUND");
    });
  });

  describe("atualizarAudiencia — modalidade", () => {
    const baseAudiencia = {
      id: 10,
      processoId: 1,
      idPje: null,
      modalidade: ModalidadeAudiencia.Presencial,
    };

    it("deve permitir trocar modalidade Presencial → Virtual em audiência manual", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok(baseAudiencia));
      (repo.updateAudiencia as jest.Mock).mockResolvedValue(
        ok({ ...baseAudiencia, modalidade: ModalidadeAudiencia.Virtual })
      );

      const result = await atualizarAudiencia(10, {
        modalidade: ModalidadeAudiencia.Virtual,
      } as UpdateAudienciaInput);

      expect(result.success).toBe(true);
      expect(repo.updateAudiencia).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ modalidade: ModalidadeAudiencia.Virtual }),
        expect.anything()
      );
    });

    it("deve permitir trocar modalidade Virtual → Hibrida em audiência manual", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(
        ok({ ...baseAudiencia, modalidade: ModalidadeAudiencia.Virtual })
      );
      (repo.updateAudiencia as jest.Mock).mockResolvedValue(
        ok({ ...baseAudiencia, modalidade: ModalidadeAudiencia.Hibrida })
      );

      const result = await atualizarAudiencia(10, {
        modalidade: ModalidadeAudiencia.Hibrida,
      } as UpdateAudienciaInput);

      expect(result.success).toBe(true);
    });

    it("deve aceitar presencaHibrida quando modalidade é Hibrida", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(
        ok({ ...baseAudiencia, modalidade: ModalidadeAudiencia.Hibrida })
      );
      (repo.updateAudiencia as jest.Mock).mockResolvedValue(
        ok({
          ...baseAudiencia,
          modalidade: ModalidadeAudiencia.Hibrida,
          presencaHibrida: PresencaHibrida.Advogado,
        })
      );

      const result = await atualizarAudiencia(10, {
        presencaHibrida: PresencaHibrida.Advogado,
      } as UpdateAudienciaInput);

      expect(result.success).toBe(true);
    });

    it("deve falhar ao informar URL virtual inválida", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok(baseAudiencia));

      const result = await atualizarAudiencia(10, {
        urlAudienciaVirtual: "nao-eh-uma-url",
      } as UpdateAudienciaInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
      expect(repo.updateAudiencia).not.toHaveBeenCalled();
    });
  });

  describe("atualizarAudiencia — whitelist PJe (idPje > 0)", () => {
    const audienciaPje = {
      id: 20,
      processoId: 1,
      idPje: 9999,
      modalidade: ModalidadeAudiencia.Virtual,
    };

    it("deve permitir editar responsavelId em audiência capturada", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok(audienciaPje));
      (repo.updateAudiencia as jest.Mock).mockResolvedValue(
        ok({ ...audienciaPje, responsavelId: 42 })
      );

      const result = await atualizarAudiencia(20, {
        responsavelId: 42,
      } as UpdateAudienciaInput);

      expect(result.success).toBe(true);
    });

    it("deve permitir editar observacoes em audiência capturada", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok(audienciaPje));
      (repo.updateAudiencia as jest.Mock).mockResolvedValue(
        ok({ ...audienciaPje, observacoes: "Anotação livre" })
      );

      const result = await atualizarAudiencia(20, {
        observacoes: "Anotação livre",
      } as UpdateAudienciaInput);

      expect(result.success).toBe(true);
    });

    it("deve rejeitar edição de modalidade em audiência capturada", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok(audienciaPje));

      const result = await atualizarAudiencia(20, {
        modalidade: ModalidadeAudiencia.Presencial,
      } as UpdateAudienciaInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toMatch(/capturada do PJE/i);
      }
      expect(repo.updateAudiencia).not.toHaveBeenCalled();
    });

    it("deve rejeitar edição de urlAudienciaVirtual em audiência capturada", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok(audienciaPje));

      const result = await atualizarAudiencia(20, {
        urlAudienciaVirtual: "https://sala.exemplo.com/nova",
      } as UpdateAudienciaInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
      expect(repo.updateAudiencia).not.toHaveBeenCalled();
    });

    it("deve rejeitar edição de enderecoPresencial em audiência capturada", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok(audienciaPje));

      const result = await atualizarAudiencia(20, {
        enderecoPresencial: {
          logradouro: "Rua A",
          numero: "10",
          bairro: "B",
          cidade: "SP",
          uf: "SP",
          cep: "01000-000",
        },
      } as UpdateAudienciaInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("deve rejeitar edição de presencaHibrida em audiência capturada", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok(audienciaPje));

      const result = await atualizarAudiencia(20, {
        presencaHibrida: PresencaHibrida.Cliente,
      } as UpdateAudienciaInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("deve rejeitar payload misto (whitelist + forbidden) em audiência capturada", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok(audienciaPje));

      const result = await atualizarAudiencia(20, {
        observacoes: "ok",
        modalidade: ModalidadeAudiencia.Presencial,
      } as UpdateAudienciaInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toMatch(/modalidade/);
      }
      expect(repo.updateAudiencia).not.toHaveBeenCalled();
    });
  });

  describe("atualizarStatusAudiencia", () => {
    it("deve atualizar status com sucesso", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok({ id: 1 }));
      (repo.atualizarStatus as jest.Mock).mockResolvedValue(
        ok({ id: 1, status: StatusAudiencia.Finalizada })
      );

      const result = await atualizarStatusAudiencia(
        1,
        StatusAudiencia.Finalizada
      );

      expect(result.success).toBe(true);
      expect(repo.atualizarStatus).toHaveBeenCalledWith(
        1,
        StatusAudiencia.Finalizada,
        undefined
      );
    });
  });
});
