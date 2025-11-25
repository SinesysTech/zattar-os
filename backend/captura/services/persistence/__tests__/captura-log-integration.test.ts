import { jest } from '@jest/globals';
import { criarCapturaLog, atualizarCapturaLog, buscarCapturaLog } from '../captura-log-persistence.service';
import { registrarCapturaRawLog, buscarLogsBrutoPorCapturaId, contarLogsBrutoPorStatus } from '../captura-raw-log.service';
import type { CapturaLog, ResultadoCapturaPartes } from '@/backend/types/captura/capturas-log-types';
import type { CapturaRawLogDocument } from '@/backend/types/mongodb/captura-log';

// Mocks
jest.mock('@/backend/utils/supabase/service-client');
jest.mock('@/backend/utils/mongodb/collections');

const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn(),
  delete: jest.fn(),
};

const mockMongoCollection = {
  insertOne: jest.fn(),
  find: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  toArray: jest.fn(),
  aggregate: jest.fn(),
};

const { createServiceClient } = require('@/backend/utils/supabase/service-client');
const { getCapturaRawLogsCollection } = require('@/backend/utils/mongodb/collections');

createServiceClient.mockReturnValue(mockSupabaseClient);
getCapturaRawLogsCollection.mockResolvedValue(mockMongoCollection);

// Fixtures
const sampleCapturaLog: Omit<CapturaLog, 'id' | 'iniciado_em' | 'created_at'> = {
  tipo_captura: 'partes',
  advogado_id: 1,
  credencial_ids: [1],
  status: 'pending',
  resultado: null,
  erro: null,
  concluido_em: null,
};

const sampleResultadoCapturaPartes: ResultadoCapturaPartes = {
  total_processos: 3,
  total_partes: 10,
  clientes: 2,
  partes_contrarias: 3,
  terceiros: 1,
  representantes: 4,
  vinculos: 10,
  erros_count: 0,
  duracao_ms: 1000,
  mongodb_ids: ['id1', 'id2', 'id3'],
  mongodb_falhas: 0,
};

const sampleCapturaRawLogSuccess: Omit<CapturaRawLogDocument, '_id' | 'criado_em' | 'atualizado_em'> = {
  captura_log_id: 1,
  tipo_captura: 'partes',
  advogado_id: 1,
  credencial_id: 1,
  trt: 'TRT3',
  grau: 'primeiro_grau',
  status: 'success',
  requisicao: { numero_processo: '1234567-89.2023.5.03.0001', id_pje: 123, processo_id: 1 },
  payload_bruto: { some: 'data' },
  resultado_processado: { total_partes: 5 },
  logs: [],
  erro: null,
};

const sampleCapturaRawLogError: Omit<CapturaRawLogDocument, '_id' | 'criado_em' | 'atualizado_em'> = {
  captura_log_id: 1,
  tipo_captura: 'partes',
  advogado_id: 1,
  credencial_id: 1,
  trt: 'TRT3',
  grau: 'primeiro_grau',
  status: 'error',
  requisicao: { numero_processo: '1234567-89.2023.5.03.0001', id_pje: 123, processo_id: 1 },
  payload_bruto: null,
  resultado_processado: null,
  logs: [{ tipo: 'erro', entidade: 'auth', erro: 'Falha na autenticação', contexto: { processo_id: 1 } }],
  erro: 'Falha na autenticação',
};

// Helper para simular processamento de um processo
async function simularProcessamentoProcesso(
  capturaLogId: number,
  processoId: number,
  numeroProcesso: string,
  status: 'success' | 'error' = 'success',
  falharMongo: boolean = false
): Promise<{ success: boolean; mongodbId: string | null; erro?: string }> {
  if (falharMongo) {
    mockMongoCollection.insertOne.mockRejectedValueOnce(new Error('MongoDB error'));
  } else {
    mockMongoCollection.insertOne.mockResolvedValueOnce({ insertedId: `mockId${processoId}` });
  }

  return await registrarCapturaRawLog({
    captura_log_id: capturaLogId,
    tipo_captura: 'partes',
    advogado_id: 1,
    credencial_id: 1,
    trt: 'TRT3',
    grau: 'primeiro_grau',
    status,
    requisicao: { numero_processo: numeroProcesso, id_pje: processoId * 100, processo_id: processoId },
    payload_bruto: status === 'success' ? { some: 'data' } : null,
    resultado_processado: status === 'success' ? { total_partes: 5 } : null,
    logs: status === 'error' ? [{ tipo: 'erro', entidade: 'auth', erro: 'Erro simulado', contexto: { processo_id: processoId } }] : [],
    erro: status === 'error' ? 'Erro simulado' : undefined,
  });
}

describe('Captura Log Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Fluxo completo de captura', () => {
    it('Captura bem-sucedida (happy path)', async () => {
      // Criar log PostgreSQL
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { ...sampleCapturaLog, id: 1, iniciado_em: new Date().toISOString(), created_at: new Date().toISOString() } });
      const capturaLog = await criarCapturaLog({
        tipo_captura: 'partes',
        advogado_id: 1,
        credencial_ids: [1],
        status: 'in_progress',
      });
      expect(capturaLog.status).toBe('in_progress');

      // Processar 3 processos
      const resultados = await Promise.all([
        simularProcessamentoProcesso(1, 1, 'proc1'),
        simularProcessamentoProcesso(1, 2, 'proc2'),
        simularProcessamentoProcesso(1, 3, 'proc3'),
      ]);
      expect(resultados.every(r => r.success)).toBe(true);

      // Atualizar log PostgreSQL
      const resultadoFinal: ResultadoCapturaPartes = {
        ...sampleResultadoCapturaPartes,
        mongodb_ids: ['mockId1', 'mockId2', 'mockId3'],
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { ...capturaLog, status: 'completed', resultado: resultadoFinal } });
      const updatedLog = await atualizarCapturaLog(1, {
        status: 'completed',
        resultado: resultadoFinal,
      });
      expect(updatedLog.status).toBe('completed');
      expect((updatedLog.resultado as ResultadoCapturaPartes).mongodb_ids).toHaveLength(3);
      expect((updatedLog.resultado as ResultadoCapturaPartes).mongodb_falhas).toBe(0);

      // Buscar logs MongoDB
      mockMongoCollection.toArray.mockResolvedValueOnce([
        { ...sampleCapturaRawLogSuccess, _id: 'mockId1', captura_log_id: 1 },
        { ...sampleCapturaRawLogSuccess, _id: 'mockId2', captura_log_id: 1 },
        { ...sampleCapturaRawLogSuccess, _id: 'mockId3', captura_log_id: 1 },
      ]);
      const mongoLogs = await buscarLogsBrutoPorCapturaId(1);
      expect(mongoLogs).toHaveLength(3);
    });

    it('Captura com erros parciais', async () => {
      // Criar log PostgreSQL
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { ...sampleCapturaLog, id: 2, iniciado_em: new Date().toISOString(), created_at: new Date().toISOString() } });
      const capturaLog = await criarCapturaLog({
        tipo_captura: 'partes',
        advogado_id: 1,
        credencial_ids: [1],
      });

      // Processar 5 processos: 3 sucesso, 2 erro
      const resultados = await Promise.all([
        simularProcessamentoProcesso(2, 1, 'proc1', 'success'),
        simularProcessamentoProcesso(2, 2, 'proc2', 'success'),
        simularProcessamentoProcesso(2, 3, 'proc3', 'success'),
        simularProcessamentoProcesso(2, 4, 'proc4', 'error'),
        simularProcessamentoProcesso(2, 5, 'proc5', 'error'),
      ]);
      expect(resultados.filter(r => r.success).length).toBe(5); // Todos salvos, mesmo erros

      // Atualizar log PostgreSQL
      const resultadoFinal: ResultadoCapturaPartes = {
        total_processos: 5,
        total_partes: 15,
        clientes: 3,
        partes_contrarias: 4,
        terceiros: 2,
        representantes: 6,
        vinculos: 15,
        erros_count: 2,
        duracao_ms: 2000,
        mongodb_ids: ['mockId1', 'mockId2', 'mockId3', 'mockId4', 'mockId5'],
        mongodb_falhas: 0,
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { ...capturaLog, status: 'completed', resultado: resultadoFinal } });
      const updatedLog = await atualizarCapturaLog(2, {
        status: 'completed',
        resultado: resultadoFinal,
      });
      expect((updatedLog.resultado as ResultadoCapturaPartes).mongodb_ids).toHaveLength(5);
      expect((updatedLog.resultado as ResultadoCapturaPartes).erros_count).toBe(2);

      // Contar logs MongoDB por status
      mockMongoCollection.aggregate.mockResolvedValueOnce([{ _id: null, success: 3, error: 2, total: 5 }]);
      const contadores = await contarLogsBrutoPorStatus(2);
      expect(contadores).toEqual({ success: 3, error: 2, total: 5 });
    });

    it('Captura com falha de autenticação', async () => {
      // Criar log PostgreSQL
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { ...sampleCapturaLog, id: 3, iniciado_em: new Date().toISOString(), created_at: new Date().toISOString() } });
      const capturaLog = await criarCapturaLog({
        tipo_captura: 'partes',
        advogado_id: 1,
        credencial_ids: [1],
      });

      // Erro de autenticação (antes de processar processos)
      const resultado = await simularProcessamentoProcesso(3, 1, 'proc1', 'error');
      expect(resultado.success).toBe(true); // Salvo no Mongo, mas erro na captura

      // Atualizar log PostgreSQL
      const resultadoFinal: ResultadoCapturaPartes = {
        total_processos: 1,
        total_partes: 0,
        clientes: 0,
        partes_contrarias: 0,
        terceiros: 0,
        representantes: 0,
        vinculos: 0,
        erros_count: 1,
        duracao_ms: 500,
        mongodb_ids: ['mockId1'],
        mongodb_falhas: 0,
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { ...capturaLog, status: 'failed', resultado: resultadoFinal, erro: 'Falha na autenticação' } });
      const updatedLog = await atualizarCapturaLog(3, {
        status: 'failed',
        resultado: resultadoFinal,
        erro: 'Falha na autenticação',
      });
      expect(updatedLog.status).toBe('failed');
      expect((updatedLog.resultado as ResultadoCapturaPartes).mongodb_ids).toHaveLength(1);

      // Verificar log MongoDB
      mockMongoCollection.toArray.mockResolvedValueOnce([
        { ...sampleCapturaRawLogError, _id: 'mockId1', captura_log_id: 3, payload_bruto: null },
      ]);
      const mongoLogs = await buscarLogsBrutoPorCapturaId(3);
      expect(mongoLogs).toHaveLength(1);
      expect(mongoLogs[0].payload_bruto).toBeNull();
      expect(mongoLogs[0].status).toBe('error');
    });

    it('Captura com falhas de persistência MongoDB', async () => {
      // Criar log PostgreSQL
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { ...sampleCapturaLog, id: 4, iniciado_em: new Date().toISOString(), created_at: new Date().toISOString() } });
      const capturaLog = await criarCapturaLog({
        tipo_captura: 'partes',
        advogado_id: 1,
        credencial_ids: [1],
      });

      // Processar 4 processos: 2 salvos, 2 falhas
      const resultados = await Promise.all([
        simularProcessamentoProcesso(4, 1, 'proc1', 'success', false),
        simularProcessamentoProcesso(4, 2, 'proc2', 'success', true), // Falha
        simularProcessamentoProcesso(4, 3, 'proc3', 'success', false),
        simularProcessamentoProcesso(4, 4, 'proc4', 'success', true), // Falha
      ]);
      expect(resultados.filter(r => r.success).length).toBe(2); // 2 salvos

      // Atualizar log PostgreSQL
      const resultadoFinal: ResultadoCapturaPartes = {
        total_processos: 4,
        total_partes: 10,
        clientes: 2,
        partes_contrarias: 2,
        terceiros: 1,
        representantes: 5,
        vinculos: 10,
        erros_count: 0,
        duracao_ms: 1500,
        mongodb_ids: ['mockId1', 'mockId3'], // Apenas os salvos
        mongodb_falhas: 2,
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { ...capturaLog, status: 'completed', resultado: resultadoFinal, erro: 'Inconsistência: 4 processos processados mas 2 logs MongoDB criados' } });
      const updatedLog = await atualizarCapturaLog(4, {
        status: 'completed',
        resultado: resultadoFinal,
        erro: 'Inconsistência: 4 processos processados mas 2 logs MongoDB criados',
      });
      expect((updatedLog.resultado as ResultadoCapturaPartes).mongodb_ids).toHaveLength(2);
      expect((updatedLog.resultado as ResultadoCapturaPartes).mongodb_falhas).toBe(2);
    });

    it('Validação de consistência', async () => {
      // Criar log PostgreSQL com mongodb_ids
      const capturaLog: CapturaLog = {
        ...sampleCapturaLog,
        id: 5,
        status: 'completed',
        resultado: { ...sampleResultadoCapturaPartes, mongodb_ids: ['id1', 'id2', 'id3'] },
        iniciado_em: new Date().toISOString(),
        concluido_em: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: capturaLog });
      const fetchedLog = await buscarCapturaLog(5);
      expect((fetchedLog!.resultado as ResultadoCapturaPartes).mongodb_ids).toEqual(['id1', 'id2', 'id3']);

      // Buscar logs MongoDB
      mockMongoCollection.toArray.mockResolvedValueOnce([
        { _id: 'id1', captura_log_id: 5 },
        { _id: 'id2', captura_log_id: 5 },
        { _id: 'id3', captura_log_id: 5 },
      ]);
      const mongoLogs = await buscarLogsBrutoPorCapturaId(5);
      expect(mongoLogs).toHaveLength(3);
      expect(mongoLogs.every(log => log.captura_log_id === 5)).toBe(true);
    });
  });

  describe('Queries cross-database', () => {
    it('Buscar log PostgreSQL → Buscar logs MongoDB via mongodb_ids', async () => {
      // Buscar log PG
      const capturaLog: CapturaLog = {
        ...sampleCapturaLog,
        id: 6,
        status: 'completed',
        resultado: { ...sampleResultadoCapturaPartes, mongodb_ids: ['id1', 'id2'] },
        iniciado_em: new Date().toISOString(),
        concluido_em: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: capturaLog });
      const fetchedLog = await buscarCapturaLog(6);
      const mongodbIds = (fetchedLog!.resultado as ResultadoCapturaPartes).mongodb_ids;

      // Buscar logs MongoDB
      mockMongoCollection.toArray.mockResolvedValueOnce([
        { _id: 'id1', payload_bruto: { data: 'test1' } },
        { _id: 'id2', payload_bruto: { data: 'test2' } },
      ]);
      const mongoLogs = await buscarLogsBrutoPorCapturaId(6);
      expect(mongoLogs).toHaveLength(2);
      expect(mongoLogs[0].payload_bruto).toEqual({ data: 'test1' });
    });

    it('Buscar logs MongoDB por captura_log_id → Buscar log PostgreSQL', async () => {
      // Buscar logs MongoDB
      mockMongoCollection.toArray.mockResolvedValueOnce([
        { _id: 'id1', captura_log_id: 7, status: 'error', erro: 'Erro de teste' },
      ]);
      const mongoLogs = await buscarLogsBrutoPorCapturaId(7);
      expect(mongoLogs[0].captura_log_id).toBe(7);

      // Buscar log PG
      const capturaLog: CapturaLog = {
        ...sampleCapturaLog,
        id: 7,
        status: 'failed',
        erro: 'Erro de teste',
        iniciado_em: new Date().toISOString(),
        concluido_em: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: capturaLog });
      const fetchedLog = await buscarCapturaLog(7);
      expect(fetchedLog!.status).toBe('failed');
      expect(fetchedLog!.erro).toBe('Erro de teste');
    });

    it('Listar capturas com erro (PostgreSQL) → Buscar logs MongoDB com status error', async () => {
      // Simular listagem de capturas com erro (não implementado aqui, assumindo busca individual)
      const capturaLog: CapturaLog = {
        ...sampleCapturaLog,
        id: 8,
        status: 'failed',
        erro: 'Erro geral',
        iniciado_em: new Date().toISOString(),
        concluido_em: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: capturaLog });
      const fetchedLog = await buscarCapturaLog(8);
      expect(fetchedLog!.status).toBe('failed');

      // Buscar logs MongoDB com error
      mockMongoCollection.toArray.mockResolvedValueOnce([
        { _id: 'id1', status: 'error', erro: 'Erro específico' },
      ]);
      const mongoLogs = await buscarLogsBrutoPorCapturaId(8);
      expect(mongoLogs[0].status).toBe('error');
      expect(mongoLogs[0].erro).toBe('Erro específico');
    });
  });

  describe('Edge cases', () => {
    it('Captura sem processos (array vazio)', async () => {
      // Criar log PostgreSQL
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { ...sampleCapturaLog, id: 9, iniciado_em: new Date().toISOString(), created_at: new Date().toISOString() } });
      const capturaLog = await criarCapturaLog({
        tipo_captura: 'partes',
        advogado_id: 1,
        credencial_ids: [1],
      });

      // Atualizar com mongodb_ids vazio
      const resultadoFinal: ResultadoCapturaPartes = {
        ...sampleResultadoCapturaPartes,
        total_processos: 0,
        mongodb_ids: [],
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { ...capturaLog, status: 'completed', resultado: resultadoFinal } });
      const updatedLog = await atualizarCapturaLog(9, {
        status: 'completed',
        resultado: resultadoFinal,
      });
      expect((updatedLog.resultado as ResultadoCapturaPartes).mongodb_ids).toHaveLength(0);
    });

    it('Captura com processo duplicado (mesmo id_pje)', async () => {
      // Criar log PostgreSQL
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { ...sampleCapturaLog, id: 10, iniciado_em: new Date().toISOString(), created_at: new Date().toISOString() } });
      const capturaLog = await criarCapturaLog({
        tipo_captura: 'partes',
        advogado_id: 1,
        credencial_ids: [1],
      });

      // Processar processos com mesmo id_pje (simular duplicação)
      const resultados = await Promise.all([
        simularProcessamentoProcesso(10, 1, 'proc1', 'success'),
        simularProcessamentoProcesso(10, 1, 'proc1', 'success'), // Mesmo processo_id
      ]);
      expect(resultados.every(r => r.success)).toBe(true);

      // Atualizar log
      const resultadoFinal: ResultadoCapturaPartes = {
        ...sampleResultadoCapturaPartes,
        total_processos: 2,
        mongodb_ids: ['mockId1', 'mockId1'], // Mesmo ID (simulando duplicação)
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { ...capturaLog, status: 'completed', resultado: resultadoFinal } });
      const updatedLog = await atualizarCapturaLog(10, {
        status: 'completed',
        resultado: resultadoFinal,
      });
      expect((updatedLog.resultado as ResultadoCapturaPartes).mongodb_ids).toHaveLength(2);
      // Nota: Em produção, deduplicação seria tratada na lógica de negócio, não aqui
    });

    it('Captura interrompida (log PostgreSQL in_progress sem atualização)', async () => {
      // Criar log PostgreSQL
      mockSupabaseClient.single.mockResolvedValueOnce({ data: { ...sampleCapturaLog, id: 11, status: 'in_progress', iniciado_em: new Date().toISOString(), created_at: new Date().toISOString() } });
      const capturaLog = await criarCapturaLog({
        tipo_captura: 'partes',
        advogado_id: 1,
        credencial_ids: [1],
        status: 'in_progress',
      });
      expect(capturaLog.status).toBe('in_progress');

      // Simular interrupção: não atualizar, mas verificar consistência
      mockMongoCollection.toArray.mockResolvedValueOnce([]); // Nenhum log MongoDB
      const mongoLogs = await buscarLogsBrutoPorCapturaId(11);
      expect(mongoLogs).toHaveLength(0);
      // Em produção, isso detectaria inconsistência
    });
  });
});