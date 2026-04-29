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
      (repo.findProcessoParaAudiencia as jest.Mock).mockResolvedValue(
        ok({ trt: 'TRT1', grau: 'primeiro_grau', numero_processo: '0001', advogado_id: 1 })
      );
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
      (repo.findProcessoParaAudiencia as jest.Mock).mockResolvedValue(ok(null));
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

  describe("criarAudiencia — validação condicional por modalidade", () => {
    const enderecoValido = {
      logradouro: 'Rua A',
      numero: '10',
      bairro: 'B',
      cidade: 'SP',
      uf: 'SP',
      cep: '01000-000',
    };

    beforeEach(() => {
      (repo.findProcessoParaAudiencia as jest.Mock).mockResolvedValue(
        ok({ trt: 'TRT1', grau: 'primeiro_grau', numero_processo: '0001', advogado_id: 1 })
      );
      (repo.tipoAudienciaExists as jest.Mock).mockResolvedValue(ok(true));
      (repo.saveAudiencia as jest.Mock).mockResolvedValue(ok({ id: 1 }));
    });

    it("Virtual sem URL → falha de validação", async () => {
      const result = await criarAudiencia({
        processoId: 1,
        dataInicio: "2026-01-01T10:00:00Z",
        dataFim: "2026-01-01T11:00:00Z",
        modalidade: ModalidadeAudiencia.Virtual,
      } as unknown as CreateAudienciaInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toMatch(/URL.*obrigatória.*virtuais/i);
      }
      expect(repo.saveAudiencia).not.toHaveBeenCalled();
    });

    it("Virtual com URL → sucesso", async () => {
      const result = await criarAudiencia({
        processoId: 1,
        dataInicio: "2026-01-01T10:00:00Z",
        dataFim: "2026-01-01T11:00:00Z",
        modalidade: ModalidadeAudiencia.Virtual,
        urlAudienciaVirtual: "https://sala.exemplo.com/x",
      } as unknown as CreateAudienciaInput);

      expect(result.success).toBe(true);
      expect(repo.saveAudiencia).toHaveBeenCalled();
    });

    it("Presencial sem endereço → falha de validação", async () => {
      const result = await criarAudiencia({
        processoId: 1,
        dataInicio: "2026-01-01T10:00:00Z",
        dataFim: "2026-01-01T11:00:00Z",
        modalidade: ModalidadeAudiencia.Presencial,
      } as unknown as CreateAudienciaInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toMatch(/endereço.*obrigatório.*presenciais/i);
      }
    });

    it("Presencial com endereço incompleto (falta UF) → falha", async () => {
      const result = await criarAudiencia({
        processoId: 1,
        dataInicio: "2026-01-01T10:00:00Z",
        dataFim: "2026-01-01T11:00:00Z",
        modalidade: ModalidadeAudiencia.Presencial,
        enderecoPresencial: { ...enderecoValido, uf: '' },
      } as unknown as CreateAudienciaInput);

      expect(result.success).toBe(false);
    });

    it("Presencial com endereço completo → sucesso", async () => {
      const result = await criarAudiencia({
        processoId: 1,
        dataInicio: "2026-01-01T10:00:00Z",
        dataFim: "2026-01-01T11:00:00Z",
        modalidade: ModalidadeAudiencia.Presencial,
        enderecoPresencial: enderecoValido,
      } as unknown as CreateAudienciaInput);

      expect(result.success).toBe(true);
    });

    it("Híbrida sem URL → falha", async () => {
      const result = await criarAudiencia({
        processoId: 1,
        dataInicio: "2026-01-01T10:00:00Z",
        dataFim: "2026-01-01T11:00:00Z",
        modalidade: ModalidadeAudiencia.Hibrida,
        enderecoPresencial: enderecoValido,
      } as unknown as CreateAudienciaInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toMatch(/URL.*obrigatória.*híbridas/i);
      }
    });

    it("Híbrida sem endereço → falha", async () => {
      const result = await criarAudiencia({
        processoId: 1,
        dataInicio: "2026-01-01T10:00:00Z",
        dataFim: "2026-01-01T11:00:00Z",
        modalidade: ModalidadeAudiencia.Hibrida,
        urlAudienciaVirtual: "https://sala.exemplo.com/x",
      } as unknown as CreateAudienciaInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toMatch(/endereço.*obrigatório.*híbridas/i);
      }
    });

    it("Híbrida completa (URL + endereço) → sucesso", async () => {
      const result = await criarAudiencia({
        processoId: 1,
        dataInicio: "2026-01-01T10:00:00Z",
        dataFim: "2026-01-01T11:00:00Z",
        modalidade: ModalidadeAudiencia.Hibrida,
        urlAudienciaVirtual: "https://sala.exemplo.com/x",
        enderecoPresencial: enderecoValido,
      } as unknown as CreateAudienciaInput);

      expect(result.success).toBe(true);
    });

    it("Sem modalidade definida → não aplica refine", async () => {
      const result = await criarAudiencia({
        processoId: 1,
        dataInicio: "2026-01-01T10:00:00Z",
        dataFim: "2026-01-01T11:00:00Z",
      } as unknown as CreateAudienciaInput);

      expect(result.success).toBe(true);
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

  describe("atualizarAudiencia — override manual em capturadas do PJe", () => {
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

    it("deve permitir editar modalidade em capturada e setar modalidadeEditadaManualmente", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok(audienciaPje));
      (repo.updateAudiencia as jest.Mock).mockResolvedValue(
        ok({ ...audienciaPje, modalidade: ModalidadeAudiencia.Presencial })
      );

      const result = await atualizarAudiencia(20, {
        modalidade: ModalidadeAudiencia.Presencial,
      } as UpdateAudienciaInput);

      expect(result.success).toBe(true);
      const callArgs = (repo.updateAudiencia as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        modalidade: ModalidadeAudiencia.Presencial,
        modalidadeEditadaManualmente: true,
      });
    });

    it("deve permitir editar urlAudienciaVirtual em capturada e setar urlEditadaManualmente", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok(audienciaPje));
      (repo.updateAudiencia as jest.Mock).mockResolvedValue(
        ok({ ...audienciaPje, urlAudienciaVirtual: "https://sala.exemplo.com/nova" })
      );

      const result = await atualizarAudiencia(20, {
        urlAudienciaVirtual: "https://sala.exemplo.com/nova",
      } as UpdateAudienciaInput);

      expect(result.success).toBe(true);
      const callArgs = (repo.updateAudiencia as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        urlAudienciaVirtual: "https://sala.exemplo.com/nova",
        urlEditadaManualmente: true,
      });
    });

    it("deve permitir editar enderecoPresencial em capturada e setar enderecoEditadoManualmente", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok(audienciaPje));
      (repo.updateAudiencia as jest.Mock).mockResolvedValue(ok(audienciaPje));

      const endereco = {
        logradouro: "Rua A",
        numero: "10",
        bairro: "B",
        cidade: "SP",
        uf: "SP",
        cep: "01000-000",
      };

      const result = await atualizarAudiencia(20, {
        enderecoPresencial: endereco,
      } as UpdateAudienciaInput);

      expect(result.success).toBe(true);
      const callArgs = (repo.updateAudiencia as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        enderecoPresencial: endereco,
        enderecoEditadoManualmente: true,
      });
    });

    it("deve permitir editar presencaHibrida em capturada (PJe não sincroniza esse campo)", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok(audienciaPje));
      (repo.updateAudiencia as jest.Mock).mockResolvedValue(
        ok({ ...audienciaPje, presencaHibrida: PresencaHibrida.Cliente })
      );

      const result = await atualizarAudiencia(20, {
        presencaHibrida: PresencaHibrida.Cliente,
      } as UpdateAudienciaInput);

      expect(result.success).toBe(true);
      // Sem flag de override para presencaHibrida — PJe nunca escreve nesse campo.
      const callArgs = (repo.updateAudiencia as jest.Mock).mock.calls[0];
      expect(callArgs[1]).not.toHaveProperty("modalidadeEditadaManualmente");
      expect(callArgs[1]).not.toHaveProperty("urlEditadaManualmente");
      expect(callArgs[1]).not.toHaveProperty("enderecoEditadoManualmente");
    });

    it("deve aceitar payload misto e setar apenas as flags dos campos de override tocados", async () => {
      (repo.findAudienciaById as jest.Mock).mockResolvedValue(ok(audienciaPje));
      (repo.updateAudiencia as jest.Mock).mockResolvedValue(ok(audienciaPje));

      const result = await atualizarAudiencia(20, {
        observacoes: "ok",
        modalidade: ModalidadeAudiencia.Presencial,
      } as UpdateAudienciaInput);

      expect(result.success).toBe(true);
      const callArgs = (repo.updateAudiencia as jest.Mock).mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        observacoes: "ok",
        modalidade: ModalidadeAudiencia.Presencial,
        modalidadeEditadaManualmente: true,
      });
      expect(callArgs[1]).not.toHaveProperty("urlEditadaManualmente");
      expect(callArgs[1]).not.toHaveProperty("enderecoEditadoManualmente");
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
