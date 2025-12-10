import { AudienciasService } from '../service';
import { AudienciasRepository } from '../repository';
import {
  Audiencia,
  StatusAudiencia,
  ModalidadeAudiencia,
  GrauTribunal,
} from '../domain';
import { Result, ok, err } from 'neverthrow';
import { z } from 'zod';
import { createAudienciaSchema, updateAudienciaSchema } from '../domain';

// Mock the entire AudienciasRepository
jest.mock('../repository');

const MockAudienciasRepository = AudienciasRepository as jest.MockedClass<typeof AudienciasRepository>;

describe('AudienciasService', () => {
  let service: AudienciasService;
  let mockRepository: jest.Mocked<AudienciasRepository>;

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    MockAudienciasRepository.mockClear();
    // Create a new mocked repository instance for each test
    mockRepository = new MockAudienciasRepository() as jest.Mocked<AudienciasRepository>;
    service = new AudienciasService(mockRepository);

    // Mock common repository methods
    mockRepository.processoExists.mockResolvedValue(ok(true));
    mockRepository.tipoAudienciaExists.mockResolvedValue(ok(true));
  });

  const mockAudiencia: Audiencia = {
    id: 1,
    idPje: null,
    advogadoId: null,
    processoId: 100,
    orgaoJulgadorId: null,
    trt: 'TRT1',
    grau: GrauTribunal.PrimeiroGrau,
    numeroProcesso: '0001234-56.2023.5.01.0001',
    dataInicio: '2025-03-15T10:00:00.000Z',
    dataFim: '2025-03-15T11:00:00.000Z',
    horaInicio: '10:00:00',
    horaFim: '11:00:00',
    modalidade: ModalidadeAudiencia.Virtual,
    presencaHibrida: null,
    salaAudienciaNome: 'Sala Virtual 1',
    salaAudienciaId: null,
    status: StatusAudiencia.Marcada,
    statusDescricao: null,
    tipoAudienciaId: 1,
    tipoDescricao: 'Inicial',
    classeJudicialId: null,
    designada: true,
    emAndamento: false,
    documentoAtivo: false,
    poloAtivoNome: 'Cliente Teste',
    poloPassivoNome: 'Reclamada Teste',
    urlAudienciaVirtual: 'https://zoom.us/j/1234567890',
    enderecoPresencial: null,
    responsavelId: null,
    observacoes: 'Observações de teste',
    dadosAnteriores: null,
    createdAt: '2025-03-10T09:00:00.000Z',
    updatedAt: '2025-03-10T09:00:00.000Z',
  };

  describe('criarAudiencia', () => {
    it('should create an audiencia with valid data', async () => {
      const input = {
        processoId: 100,
        dataInicio: '2025-03-15T10:00:00.000Z',
        dataFim: '2025-03-15T11:00:00.000Z',
        modalidade: ModalidadeAudiencia.Virtual,
        tipoAudienciaId: 1,
        urlAudienciaVirtual: 'https://zoom.us/j/1234567890',
      };
      mockRepository.saveAudiencia.mockResolvedValueOnce(ok(mockAudiencia));

      const result = await service.criarAudiencia(input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockAudiencia);
      expect(mockRepository.saveAudiencia).toHaveBeenCalledWith(
        expect.objectContaining(input)
      );
    });

    it('should return an error for invalid data (Zod validation)', async () => {
      const invalidInput = {
        processoId: 100,
        dataInicio: '2025-03-15T11:00:00.000Z',
        dataFim: '2025-03-15T10:00:00.000Z', // dataFim before dataInicio
      };

      const result = await service.criarAudiencia(invalidInput as any); // Cast to any for Zod error

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(z.ZodError);
      expect((result._unsafeUnwrapErr() as z.ZodError).errors[0].message).toBe(
        'A data de fim deve ser posterior à data de início.'
      );
      expect(mockRepository.saveAudiencia).not.toHaveBeenCalled();
    });

    it('should return an error if processoId does not exist', async () => {
      mockRepository.processoExists.mockResolvedValueOnce(ok(false));
      const input = {
        processoId: 999,
        dataInicio: '2025-03-15T10:00:00.000Z',
        dataFim: '2025-03-15T11:00:00.000Z',
      };

      const result = await service.criarAudiencia(input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toEqual(new Error('Processo não encontrado.'));
      expect(mockRepository.saveAudiencia).not.toHaveBeenCalled();
    });

    it('should return an error if tipoAudienciaId does not exist', async () => {
      mockRepository.tipoAudienciaExists.mockResolvedValueOnce(ok(false));
      const input = {
        processoId: 100,
        dataInicio: '2025-03-15T10:00:00.000Z',
        dataFim: '2025-03-15T11:00:00.000Z',
        tipoAudienciaId: 999,
      };

      const result = await service.criarAudiencia(input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toEqual(new Error('Tipo de audiência não encontrado.'));
      expect(mockRepository.saveAudiencia).not.toHaveBeenCalled();
    });

    it('should return a repository error if saveAudiencia fails', async () => {
      const repoError = new Error('Database error');
      mockRepository.saveAudiencia.mockResolvedValueOnce(err(repoError));
      const input = {
        processoId: 100,
        dataInicio: '2025-03-15T10:00:00.000Z',
        dataFim: '2025-03-15T11:00:00.000Z',
      };

      const result = await service.criarAudiencia(input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toEqual(new Error('Erro ao criar audiência.'));
    });
  });

  describe('buscarAudiencia', () => {
    it('should return an audiencia if found', async () => {
      mockRepository.findAudienciaById.mockResolvedValueOnce(ok(mockAudiencia));

      const result = await service.buscarAudiencia(1);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(mockAudiencia);
      expect(mockRepository.findAudienciaById).toHaveBeenCalledWith(1);
    });

    it('should return null if audiencia not found', async () => {
      mockRepository.findAudienciaById.mockResolvedValueOnce(ok(null));

      const result = await service.buscarAudiencia(999);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
    });

    it('should return an error for invalid ID', async () => {
      const result = await service.buscarAudiencia(0);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toEqual(new Error('ID inválido.'));
      expect(mockRepository.findAudienciaById).not.toHaveBeenCalled();
    });
  });

  describe('listarAudiencias', () => {
    it('should list audiencias with default pagination and sorting', async () => {
      const paginatedResponse = {
        data: [mockAudiencia],
        pagination: { currentPage: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
      };
      mockRepository.findAllAudiencias.mockResolvedValueOnce(ok(paginatedResponse));

      const result = await service.listarAudiencias({});

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(paginatedResponse);
      expect(mockRepository.findAllAudiencias).toHaveBeenCalledWith({
        pagina: 1,
        limite: 10,
        ordenarPor: 'data_inicio',
        ordem: 'asc',
      });
    });

    it('should apply pagination and sorting from params', async () => {
      const params = { pagina: 2, limite: 5, ordenarPor: 'numeroProcesso' as const, ordem: 'desc' as const };
      const paginatedResponse = {
        data: [mockAudiencia],
        pagination: { currentPage: 2, pageSize: 5, totalCount: 1, totalPages: 1 },
      };
      mockRepository.findAllAudiencias.mockResolvedValueOnce(ok(paginatedResponse));

      const result = await service.listarAudiencias(params);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(paginatedResponse);
      expect(mockRepository.findAllAudiencias).toHaveBeenCalledWith({
        pagina: 2,
        limite: 5,
        ordenarPor: 'numeroProcesso',
        ordem: 'desc',
      });
    });

    it('should return a repository error if findAllAudiencias fails', async () => {
      const repoError = new Error('Failed to fetch from DB');
      mockRepository.findAllAudiencias.mockResolvedValueOnce(err(repoError));

      const result = await service.listarAudiencias({});

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toEqual(repoError);
    });
  });

  describe('atualizarAudiencia', () => {
    it('should update an audiencia with valid data', async () => {
      const updatedAudiencia = { ...mockAudiencia, observacoes: 'Updated notes' };
      const input = { observacoes: 'Updated notes' };
      mockRepository.findAudienciaById.mockResolvedValueOnce(ok(mockAudiencia));
      mockRepository.updateAudiencia.mockResolvedValueOnce(ok(updatedAudiencia));

      const result = await service.atualizarAudiencia(1, input);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(updatedAudiencia);
      expect(mockRepository.updateAudiencia).toHaveBeenCalledWith(1, input, mockAudiencia);
    });

    it('should return an error if audiencia to update is not found', async () => {
      mockRepository.findAudienciaById.mockResolvedValueOnce(ok(null));
      const input = { observacoes: 'Updated notes' };

      const result = await service.atualizarAudiencia(999, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toEqual(new Error('Audiência não encontrada.'));
      expect(mockRepository.updateAudiencia).not.toHaveBeenCalled();
    });

    it('should return an error for invalid update data (Zod validation)', async () => {
      mockRepository.findAudienciaById.mockResolvedValueOnce(ok(mockAudiencia));
      const invalidInput = {
        dataInicio: '2025-03-15T11:00:00.000Z',
        dataFim: '2025-03-15T10:00:00.000Z', // dataFim before dataInicio
      };

      const result = await service.atualizarAudiencia(1, invalidInput as any);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(z.ZodError);
      expect((result._unsafeUnwrapErr() as z.ZodError).errors[0].message).toBe(
        'A data de fim deve ser posterior à data de início.'
      );
      expect(mockRepository.updateAudiencia).not.toHaveBeenCalled();
    });

    it('should return a repository error if updateAudiencia fails', async () => {
      mockRepository.findAudienciaById.mockResolvedValueOnce(ok(mockAudiencia));
      const repoError = new Error('Update failed');
      mockRepository.updateAudiencia.mockResolvedValueOnce(err(repoError));
      const input = { observacoes: 'Updated notes' };

      const result = await service.atualizarAudiencia(1, input);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toEqual(new Error('Erro ao atualizar audiência.'));
    });
  });

  describe('atualizarStatusAudiencia', () => {
    it('should update the status of an audiencia', async () => {
      const updatedAudiencia = { ...mockAudiencia, status: StatusAudiencia.Finalizada };
      mockRepository.findAudienciaById.mockResolvedValueOnce(ok(mockAudiencia));
      mockRepository.atualizarStatus.mockResolvedValueOnce(ok(updatedAudiencia));

      const result = await service.atualizarStatusAudiencia(1, StatusAudiencia.Finalizada);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(updatedAudiencia);
      expect(mockRepository.atualizarStatus).toHaveBeenCalledWith(1, StatusAudiencia.Finalizada, undefined);
    });

    it('should update the status and description of an audiencia', async () => {
      const updatedAudiencia = {
        ...mockAudiencia,
        status: StatusAudiencia.Cancelada,
        statusDescricao: 'Client cancelled',
      };
      mockRepository.findAudienciaById.mockResolvedValueOnce(ok(mockAudiencia));
      mockRepository.atualizarStatus.mockResolvedValueOnce(ok(updatedAudiencia));

      const result = await service.atualizarStatusAudiencia(1, StatusAudiencia.Cancelada, 'Client cancelled');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(updatedAudiencia);
      expect(mockRepository.atualizarStatus).toHaveBeenCalledWith(
        1,
        StatusAudiencia.Cancelada,
        'Client cancelled'
      );
    });

    it('should return an error for invalid status', async () => {
      const result = await service.atualizarStatusAudiencia(1, 'INVALID_STATUS' as StatusAudiencia);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toEqual(new Error('Status inválido.'));
      expect(mockRepository.atualizarStatus).not.toHaveBeenCalled();
    });

    it('should return an error if audiencia to update status is not found', async () => {
      mockRepository.findAudienciaById.mockResolvedValueOnce(ok(null));
      const result = await service.atualizarStatusAudiencia(999, StatusAudiencia.Finalizada);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toEqual(new Error('Audiência não encontrada.'));
      expect(mockRepository.atualizarStatus).not.toHaveBeenCalled();
    });

    it('should return a repository error if atualizarStatus fails', async () => {
      mockRepository.findAudienciaById.mockResolvedValueOnce(ok(mockAudiencia));
      const repoError = new Error('Status update failed');
      mockRepository.atualizarStatus.mockResolvedValueOnce(err(repoError));

      const result = await service.atualizarStatusAudiencia(1, StatusAudiencia.Finalizada);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toEqual(repoError);
    });
  });
});
