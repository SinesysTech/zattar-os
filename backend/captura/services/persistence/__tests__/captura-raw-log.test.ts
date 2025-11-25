import { jest } from '@jest/globals';
import type { Collection, InsertOneResult, ObjectId } from 'mongodb';
import type { CapturaRawLogDocument, StatusCapturaRaw } from '@/backend/types/mongodb/captura-log';
import type { TipoCaptura } from '@/backend/types/captura/capturas-log-types';
import type { CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';
import type { LogEntry } from '@/backend/captura/services/persistence/capture-log.service';
import {
  registrarCapturaRawLog,
  buscarLogsBrutoPorCapturaId,
  contarLogsBrutoPorStatus,
} from '../captura-raw-log.service';

// Mock do MongoDB collection
jest.mock('@/backend/utils/mongodb/collections', () => ({
  getCapturaRawLogsCollection: jest.fn(),
}));

const { getCapturaRawLogsCollection } = await import('@/backend/utils/mongodb/collections');

// Fixtures
const mockTipoCaptura: TipoCaptura = 'partes';
const mockTrt: CodigoTRT = 'TRT1';
const mockGrau: GrauTRT = 'primeiro_grau';

const mockLogEntry: LogEntry = {
  tipo: 'erro',
  entidade: 'acervo',
  erro: 'Erro de teste',
};

const mockDocumentoSuccess: Omit<CapturaRawLogDocument, '_id' | 'criado_em' | 'atualizado_em'> = {
  captura_log_id: 1,
  tipo_captura: mockTipoCaptura,
  advogado_id: 123,
  credencial_id: 456,
  trt: mockTrt,
  grau: mockGrau,
  status: 'success',
  requisicao: { processo_id: 789, numero_processo: '1234567-89.2023.5.01.0001', id_pje: 101 },
  payload_bruto: { data: 'mock payload' },
  resultado_processado: { partes: [] },
  logs: [mockLogEntry],
  erro: null,
};

const mockDocumentoError: Omit<CapturaRawLogDocument, '_id' | 'criado_em' | 'atualizado_em'> = {
  captura_log_id: 1,
  tipo_captura: mockTipoCaptura,
  advogado_id: 123,
  credencial_id: 456,
  trt: mockTrt,
  grau: mockGrau,
  status: 'error',
  requisicao: { processo_id: 789, numero_processo: '1234567-89.2023.5.01.0001', id_pje: 101 },
  payload_bruto: null,
  resultado_processado: null,
  logs: [mockLogEntry],
  erro: 'Erro de autenticação',
};

const mockDocumentoInconsistente: Omit<CapturaRawLogDocument, '_id' | 'criado_em' | 'atualizado_em'> = {
  ...mockDocumentoSuccess,
  payload_bruto: null,
  status: 'success',
};

// Helper para criar documento de teste
function criarDocumentoTeste(overrides: Partial<Omit<CapturaRawLogDocument, '_id' | 'criado_em' | 'atualizado_em'>> = {}): Omit<CapturaRawLogDocument, '_id' | 'criado_em' | 'atualizado_em'> {
  return {
    ...mockDocumentoSuccess,
    ...overrides,
  };
}

describe('captura-raw-log.service', () => {
  let mockCollection: jest.Mocked<Collection<CapturaRawLogDocument>>;

  beforeEach(() => {
    mockCollection = {
      insertOne: jest.fn(),
      find: jest.fn(),
      aggregate: jest.fn(),
    } as any;

    (getCapturaRawLogsCollection as jest.Mock).mockResolvedValue(mockCollection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registrarCapturaRawLog', () => {
    it('✅ Salvar log com status "success" e payload completo', async () => {
      const mockResult: InsertOneResult<CapturaRawLogDocument> = {
        acknowledged: true,
        insertedId: new ObjectId('507f1f77bcf86cd799439011'),
      };
      mockCollection.insertOne.mockResolvedValue(mockResult);

      const params = criarDocumentoTeste();
      const result = await registrarCapturaRawLog(params);

      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        ...params,
        criado_em: expect.any(Date),
        atualizado_em: expect.any(Date),
      });
      expect(result).toEqual({
        success: true,
        mongodbId: '507f1f77bcf86cd799439011',
      });
    });

    it('✅ Salvar log com status "error" e payload_bruto: null (erro de autenticação)', async () => {
      const mockResult: InsertOneResult<CapturaRawLogDocument> = {
        acknowledged: true,
        insertedId: new ObjectId('507f1f77bcf86cd799439012'),
      };
      mockCollection.insertOne.mockResolvedValue(mockResult);

      const params = criarDocumentoTeste(mockDocumentoError);
      const result = await registrarCapturaRawLog(params);

      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        ...params,
        criado_em: expect.any(Date),
        atualizado_em: expect.any(Date),
      });
      expect(result).toEqual({
        success: true,
        mongodbId: '507f1f77bcf86cd799439012',
      });
    });

    it('✅ Validar campos obrigatórios (novos tipos)', async () => {
      const params = criarDocumentoTeste({ tipo_captura: undefined as any });
      const result = await registrarCapturaRawLog(params);

      expect(result.success).toBe(false);
      expect(result.erro).toContain('Campos obrigatórios ausentes');
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('✅ Validar auto-preenchimento de criado_em e atualizado_em', async () => {
      const mockResult: InsertOneResult<CapturaRawLogDocument> = {
        acknowledged: true,
        insertedId: new ObjectId('507f1f77bcf86cd799439013'),
      };
      mockCollection.insertOne.mockResolvedValue(mockResult);

      const params = criarDocumentoTeste();
      await registrarCapturaRawLog(params);

      const callArgs = mockCollection.insertOne.mock.calls[0][0];
      expect(callArgs.criado_em).toBeInstanceOf(Date);
      expect(callArgs.atualizado_em).toBeInstanceOf(Date);
    });

    it('✅ Retornar { success: true, mongodbId: string } em sucesso', async () => {
      const mockResult: InsertOneResult<CapturaRawLogDocument> = {
        acknowledged: true,
        insertedId: new ObjectId('507f1f77bcf86cd799439014'),
      };
      mockCollection.insertOne.mockResolvedValue(mockResult);

      const params = criarDocumentoTeste();
      const result = await registrarCapturaRawLog(params);

      expect(result).toEqual({
        success: true,
        mongodbId: '507f1f77bcf86cd799439014',
      });
    });

    it('❌ Retornar { success: false, mongodbId: null, erro: string } em erro de MongoDB', async () => {
      mockCollection.insertOne.mockRejectedValue(new Error('Erro de conexão MongoDB'));

      const params = criarDocumentoTeste();
      const result = await registrarCapturaRawLog(params);

      expect(result).toEqual({
        success: false,
        mongodbId: null,
        erro: 'Erro de conexão MongoDB',
      });
    });

    it('❌ Logar erro detalhado (verificar console.error com contexto completo)', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockCollection.insertOne.mockRejectedValue(new Error('Erro de conexão MongoDB'));

      const params = criarDocumentoTeste();
      await registrarCapturaRawLog(params);

      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ [CapturaRawLog] Erro ao persistir log bruto da captura:',
        {
          captura_log_id: params.captura_log_id,
          tipo_captura: params.tipo_captura,
          trt: params.trt,
          grau: params.grau,
          processo_id: params.requisicao?.processo_id || 'N/A',
        },
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('⚠️ Warning quando payload_bruto é null mas status é "success" (inconsistência)', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockResult: InsertOneResult<CapturaRawLogDocument> = {
        acknowledged: true,
        insertedId: new ObjectId('507f1f77bcf86cd799439015'),
      };
      mockCollection.insertOne.mockResolvedValue(mockResult);

      const params = criarDocumentoTeste(mockDocumentoInconsistente);
      await registrarCapturaRawLog(params);

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ [CapturaRawLog] Inconsistência: payload_bruto é null mas status é \'success\' para captura_log_id=1'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('buscarLogsBrutoPorCapturaId', () => {
    it('✅ Buscar todos os logs de uma captura (múltiplos documentos)', async () => {
      const mockDocumentos: CapturaRawLogDocument[] = [
        { ...mockDocumentoSuccess, _id: new ObjectId(), criado_em: new Date(), atualizado_em: new Date() },
        { ...mockDocumentoError, _id: new ObjectId(), criado_em: new Date(), atualizado_em: new Date() },
      ];
      const mockCursor = {
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockDocumentos),
      };
      mockCollection.find.mockReturnValue(mockCursor as any);

      const result = await buscarLogsBrutoPorCapturaId(1);

      expect(mockCollection.find).toHaveBeenCalledWith({ captura_log_id: 1 });
      expect(mockCursor.sort).toHaveBeenCalledWith({ criado_em: -1 });
      expect(result).toEqual(mockDocumentos);
    });

    it('✅ Retornar array vazio quando nenhum log encontrado', async () => {
      const mockCursor = {
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([]),
      };
      mockCollection.find.mockReturnValue(mockCursor as any);

      const result = await buscarLogsBrutoPorCapturaId(999);

      expect(result).toEqual([]);
    });

    it('✅ Ordenar por criado_em (mais recentes primeiro)', async () => {
      const mockCursor = {
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([]),
      };
      mockCollection.find.mockReturnValue(mockCursor as any);

      await buscarLogsBrutoPorCapturaId(1);

      expect(mockCursor.sort).toHaveBeenCalledWith({ criado_em: -1 });
    });

    it('❌ Erro de MongoDB', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockCursor = {
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockRejectedValue(new Error('Erro de MongoDB')),
      };
      mockCollection.find.mockReturnValue(mockCursor as any);

      const result = await buscarLogsBrutoPorCapturaId(1);

      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ [CapturaRawLog] Erro ao buscar logs brutos para captura_log_id=1:',
        expect.any(Error)
      );
      expect(result).toEqual([]);

      consoleSpy.mockRestore();
    });
  });

  describe('contarLogsBrutoPorStatus', () => {
    it('✅ Contar logs por status: { success: 5, error: 2, total: 7 }', async () => {
      const mockResult = [{ _id: null, success: 5, error: 2, total: 7 }];
      mockCollection.aggregate.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockResult),
      } as any);

      const result = await contarLogsBrutoPorStatus(1);

      expect(mockCollection.aggregate).toHaveBeenCalledWith([
        { $match: { captura_log_id: 1 } },
        {
          $group: {
            _id: null,
            success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
            error: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } },
            total: { $sum: 1 },
          },
        },
      ]);
      expect(result).toEqual({ success: 5, error: 2, total: 7 });
    });

    it('✅ Retornar zeros quando nenhum log encontrado', async () => {
      mockCollection.aggregate.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await contarLogsBrutoPorStatus(999);

      expect(result).toEqual({ success: 0, error: 0, total: 0 });
    });

    it('❌ Erro de MongoDB', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockCollection.aggregate.mockReturnValue({
        toArray: jest.fn().mockRejectedValue(new Error('Erro de MongoDB')),
      } as any);

      const result = await contarLogsBrutoPorStatus(1);

      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ [CapturaRawLog] Erro ao contar logs brutos para captura_log_id=1:',
        expect.any(Error)
      );
      expect(result).toEqual({ success: 0, error: 0, total: 0 });

      consoleSpy.mockRestore();
    });
  });

  describe('Testes de validação (novos tipos obrigatórios)', () => {
    it('❌ Erro quando captura_log_id inválido (< -1)', async () => {
      const params = criarDocumentoTeste({ captura_log_id: -2 });
      const result = await registrarCapturaRawLog(params);

      expect(result.success).toBe(false);
      expect(result.erro).toContain('captura_log_id inválido: -2');
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('❌ Erro quando advogado_id inválido (< -1)', async () => {
      const params = criarDocumentoTeste({ advogado_id: -2 });
      const result = await registrarCapturaRawLog(params);

      expect(result.success).toBe(false);
      expect(result.erro).toContain('Campos obrigatórios ausentes');
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('❌ Erro quando credencial_id inválido (< -1)', async () => {
      const params = criarDocumentoTeste({ credencial_id: -2 });
      const result = await registrarCapturaRawLog(params);

      expect(result.success).toBe(false);
      expect(result.erro).toContain('Campos obrigatórios ausentes');
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('❌ Erro quando trt ou grau ausentes (capturas TRT)', async () => {
      const params = criarDocumentoTeste({ trt: undefined as any });
      const result = await registrarCapturaRawLog(params);

      expect(result.success).toBe(false);
      expect(result.erro).toContain('Campos obrigatórios ausentes');
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('✅ Aceitar captura_log_id: -1 (erro antes de criar log PostgreSQL)', async () => {
      const mockResult: InsertOneResult<CapturaRawLogDocument> = {
        acknowledged: true,
        insertedId: new ObjectId('507f1f77bcf86cd799439016'),
      };
      mockCollection.insertOne.mockResolvedValue(mockResult);

      const params = criarDocumentoTeste({ captura_log_id: -1 });
      const result = await registrarCapturaRawLog(params);

      expect(result.success).toBe(true);
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });
  });

  describe('Testes de integração', () => {
    it('✅ Salvar múltiplos logs → Buscar por captura_log_id → Validar quantidade', async () => {
      const mockResult1: InsertOneResult<CapturaRawLogDocument> = {
        acknowledged: true,
        insertedId: new ObjectId('507f1f77bcf86cd799439017'),
      };
      const mockResult2: InsertOneResult<CapturaRawLogDocument> = {
        acknowledged: true,
        insertedId: new ObjectId('507f1f77bcf86cd799439018'),
      };
      mockCollection.insertOne
        .mockResolvedValueOnce(mockResult1)
        .mockResolvedValueOnce(mockResult2);

      const mockDocumentos: CapturaRawLogDocument[] = [
        { ...mockDocumentoSuccess, _id: new ObjectId(), criado_em: new Date(), atualizado_em: new Date() },
        { ...mockDocumentoError, _id: new ObjectId(), criado_em: new Date(), atualizado_em: new Date() },
      ];
      const mockCursor = {
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockDocumentos),
      };
      mockCollection.find.mockReturnValue(mockCursor as any);

      // Salvar múltiplos
      await registrarCapturaRawLog(criarDocumentoTeste());
      await registrarCapturaRawLog(criarDocumentoTeste(mockDocumentoError));

      // Buscar
      const result = await buscarLogsBrutoPorCapturaId(1);

      expect(result).toHaveLength(2);
    });

    it('✅ Salvar logs com status diferentes → Contar por status → Validar contadores', async () => {
      const mockResult1: InsertOneResult<CapturaRawLogDocument> = {
        acknowledged: true,
        insertedId: new ObjectId('507f1f77bcf86cd799439019'),
      };
      const mockResult2: InsertOneResult<CapturaRawLogDocument> = {
        acknowledged: true,
        insertedId: new ObjectId('507f1f77bcf86cd799439020'),
      };
      mockCollection.insertOne
        .mockResolvedValueOnce(mockResult1)
        .mockResolvedValueOnce(mockResult2);

      const mockResult = [{ _id: null, success: 1, error: 1, total: 2 }];
      mockCollection.aggregate.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockResult),
      } as any);

      // Salvar com status diferentes
      await registrarCapturaRawLog(criarDocumentoTeste({ status: 'success' }));
      await registrarCapturaRawLog(criarDocumentoTeste({ status: 'error' }));

      // Contar
      const result = await contarLogsBrutoPorStatus(1);

      expect(result).toEqual({ success: 1, error: 1, total: 2 });
    });

    it('✅ Salvar log com logs array (LogEntry) → Buscar → Validar estrutura', async () => {
      const mockResult: InsertOneResult<CapturaRawLogDocument> = {
        acknowledged: true,
        insertedId: new ObjectId('507f1f77bcf86cd799439021'),
      };
      mockCollection.insertOne.mockResolvedValue(mockResult);

      const mockDocumento: CapturaRawLogDocument = {
        ...mockDocumentoSuccess,
        _id: new ObjectId(),
        criado_em: new Date(),
        atualizado_em: new Date(),
      };
      const mockCursor = {
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([mockDocumento]),
      };
      mockCollection.find.mockReturnValue(mockCursor as any);

      // Salvar
      await registrarCapturaRawLog(criarDocumentoTeste());

      // Buscar
      const result = await buscarLogsBrutoPorCapturaId(1);

      expect(result).toHaveLength(1);
      expect(result[0].logs).toEqual([mockLogEntry]);
      expect(result[0].logs?.[0]).toHaveProperty('tipo', 'erro');
      expect(result[0].logs?.[0]).toHaveProperty('entidade', 'acervo');
    });
  });
});