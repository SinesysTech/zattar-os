// Suite de testes unitários para captura-log-persistence.service.ts

import { jest } from '@jest/globals';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  CapturaLog,
  CriarCapturaLogParams,
  AtualizarCapturaLogParams,
  ListarCapturasLogParams,
  ResultadoCapturaPartes,
} from '@/backend/types/captura/capturas-log-types';
import {
  criarCapturaLog,
  atualizarCapturaLog,
  buscarCapturaLog,
  listarCapturasLog,
  deletarCapturaLog,
} from '../captura-log-persistence.service';

// Mock do Supabase
jest.mock('@/backend/utils/supabase/service-client');
const mockCreateServiceClient = createServiceClient as jest.MockedFunction<typeof createServiceClient>;

// Fixtures de CapturaLog
const mockCapturaLogPending: CapturaLog = {
  id: 1,
  tipo_captura: 'partes',
  advogado_id: 123,
  credencial_ids: [456],
  status: 'pending',
  resultado: null,
  erro: null,
  iniciado_em: '2023-01-01T00:00:00.000Z',
  concluido_em: null,
  created_at: '2023-01-01T00:00:00.000Z',
};

const mockCapturaLogInProgress: CapturaLog = {
  ...mockCapturaLogPending,
  id: 2,
  status: 'in_progress',
};

const mockCapturaLogCompleted: CapturaLog = {
  ...mockCapturaLogPending,
  id: 3,
  status: 'completed',
  resultado: {
    total_processos: 10,
    total_partes: 20,
    clientes: 5,
    partes_contrarias: 10,
    terceiros: 3,
    representantes: 2,
    vinculos: 15,
    erros_count: 0,
    duracao_ms: 5000,
    mongodb_ids: ['id1', 'id2'],
    mongodb_falhas: 0,
  },
  concluido_em: '2023-01-01T00:05:00.000Z',
};

const mockCapturaLogFailed: CapturaLog = {
  ...mockCapturaLogPending,
  id: 4,
  status: 'failed',
  erro: 'Erro de teste',
  concluido_em: '2023-01-01T00:05:00.000Z',
};

const mockResultadoCapturaPartes: ResultadoCapturaPartes = {
  total_processos: 5,
  total_partes: 10,
  clientes: 2,
  partes_contrarias: 5,
  terceiros: 1,
  representantes: 1,
  vinculos: 7,
  erros_count: 1,
  duracao_ms: 3000,
  mongodb_ids: ['mongo1', 'mongo2'],
  mongodb_falhas: 1,
};

// Helper para criar mock do Supabase
function createMockSupabase() {
  return {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };
}

describe('captura-log-persistence.service.ts', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    mockCreateServiceClient.mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('criarCapturaLog', () => {
    it('✅ Criar log com status "pending" (default)', async () => {
      const params: CriarCapturaLogParams = {
        tipo_captura: 'partes',
        advogado_id: 123,
        credencial_ids: [456],
      };

      mockSupabase.single.mockResolvedValue({ data: mockCapturaLogPending, error: null });

      const result = await criarCapturaLog(params);

      expect(mockSupabase.from).toHaveBeenCalledWith('capturas_log');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        tipo_captura: 'partes',
        advogado_id: 123,
        credencial_ids: [456],
        status: 'pending',
      });
      expect(result).toEqual(mockCapturaLogPending);
    });

    it('✅ Criar log com status "in_progress"', async () => {
      const params: CriarCapturaLogParams = {
        tipo_captura: 'partes',
        advogado_id: 123,
        credencial_ids: [456],
        status: 'in_progress',
      };

      mockSupabase.single.mockResolvedValue({ data: mockCapturaLogInProgress, error: null });

      const result = await criarCapturaLog(params);

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        tipo_captura: 'partes',
        advogado_id: 123,
        credencial_ids: [456],
        status: 'in_progress',
      });
      expect(result).toEqual(mockCapturaLogInProgress);
    });

    it('✅ Validar campos obrigatórios', async () => {
      const params: CriarCapturaLogParams = {
        tipo_captura: 'partes',
        advogado_id: 123,
        credencial_ids: [456],
      };

      mockSupabase.single.mockResolvedValue({ data: mockCapturaLogPending, error: null });

      await criarCapturaLog(params);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_captura: 'partes',
          advogado_id: 123,
          credencial_ids: [456],
        })
      );
    });

    it('❌ Erro ao criar log (Supabase error)', async () => {
      const params: CriarCapturaLogParams = {
        tipo_captura: 'partes',
        advogado_id: 123,
        credencial_ids: [456],
      };

      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Database error' } });

      await expect(criarCapturaLog(params)).rejects.toThrow('Erro ao criar registro de captura: Database error');
    });

    it('❌ Erro quando nenhum dado retornado', async () => {
      const params: CriarCapturaLogParams = {
        tipo_captura: 'partes',
        advogado_id: 123,
        credencial_ids: [456],
      };

      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      await expect(criarCapturaLog(params)).rejects.toThrow('Erro ao criar registro de captura: nenhum dado retornado');
    });
  });

  describe('atualizarCapturaLog', () => {
    it('✅ Atualizar status para "completed" (auto-preenche concluido_em)', async () => {
      const params: AtualizarCapturaLogParams = { status: 'completed' };

      mockSupabase.single.mockResolvedValue({ data: mockCapturaLogCompleted, error: null });

      const result = await atualizarCapturaLog(1, params);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          concluido_em: expect.any(String),
        })
      );
      expect(result).toEqual(mockCapturaLogCompleted);
    });

    it('✅ Atualizar status para "failed" (auto-preenche concluido_em)', async () => {
      const params: AtualizarCapturaLogParams = { status: 'failed' };

      mockSupabase.single.mockResolvedValue({ data: mockCapturaLogFailed, error: null });

      const result = await atualizarCapturaLog(1, params);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          concluido_em: expect.any(String),
        })
      );
      expect(result).toEqual(mockCapturaLogFailed);
    });

    it('✅ Atualizar resultado com ResultadoCapturaPartes (incluindo mongodb_ids)', async () => {
      const params: AtualizarCapturaLogParams = { resultado: mockResultadoCapturaPartes };

      mockSupabase.single.mockResolvedValue({ data: { ...mockCapturaLogCompleted, resultado: mockResultadoCapturaPartes }, error: null });

      const result = await atualizarCapturaLog(1, params);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          resultado: mockResultadoCapturaPartes,
        })
      );
      expect(result.resultado).toEqual(mockResultadoCapturaPartes);
      expect((result.resultado as ResultadoCapturaPartes).mongodb_ids).toEqual(['mongo1', 'mongo2']);
    });

    it('✅ Atualizar erro (string)', async () => {
      const params: AtualizarCapturaLogParams = { erro: 'Erro de teste' };

      mockSupabase.single.mockResolvedValue({ data: mockCapturaLogFailed, error: null });

      const result = await atualizarCapturaLog(1, params);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          erro: 'Erro de teste',
        })
      );
      expect(result.erro).toBe('Erro de teste');
    });

    it('✅ Atualizar apenas campos fornecidos (partial update)', async () => {
      const params: AtualizarCapturaLogParams = { erro: 'Erro parcial' };

      mockSupabase.single.mockResolvedValue({ data: { ...mockCapturaLogPending, erro: 'Erro parcial' }, error: null });

      const result = await atualizarCapturaLog(1, params);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          erro: 'Erro parcial',
        })
      );
      expect(result.status).toBe('pending'); // Não alterado
    });

    it('❌ Erro ao atualizar log inexistente (PGRST116)', async () => {
      const params: AtualizarCapturaLogParams = { status: 'completed' };

      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } });

      await expect(atualizarCapturaLog(999, params)).rejects.toThrow('Registro de captura não encontrado');
    });

    it('❌ Erro genérico de Supabase', async () => {
      const params: AtualizarCapturaLogParams = { status: 'completed' };

      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Generic error' } });

      await expect(atualizarCapturaLog(1, params)).rejects.toThrow('Erro ao atualizar registro de captura: Generic error');
    });
  });

  describe('buscarCapturaLog', () => {
    it('✅ Buscar log existente por ID', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockCapturaLogPending, error: null });

      const result = await buscarCapturaLog(1);

      expect(mockSupabase.from).toHaveBeenCalledWith('capturas_log');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual(mockCapturaLogPending);
    });

    it('✅ Retornar null para log inexistente (PGRST116)', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await buscarCapturaLog(999);

      expect(result).toBeNull();
    });

    it('❌ Erro genérico de Supabase', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Generic error' } });

      await expect(buscarCapturaLog(1)).rejects.toThrow('Erro ao buscar registro de captura: Generic error');
    });
  });

  describe('listarCapturasLog', () => {
    it('✅ Listar todos os logs (sem filtros)', async () => {
      const mockData = [mockCapturaLogPending, mockCapturaLogCompleted];
      mockSupabase.range.mockResolvedValue({ data: mockData, error: null, count: 2 });

      const result = await listarCapturasLog();

      expect(mockSupabase.from).toHaveBeenCalledWith('capturas_log');
      expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 49);
      expect(result.capturas).toEqual(mockData);
      expect(result.total).toBe(2);
      expect(result.pagina).toBe(1);
      expect(result.limite).toBe(50);
      expect(result.totalPaginas).toBe(1);
    });

    it('✅ Filtrar por tipo_captura', async () => {
      const params: ListarCapturasLogParams = { tipo_captura: 'partes' };
      mockSupabase.range.mockResolvedValue({ data: [mockCapturaLogPending], error: null, count: 1 });

      await listarCapturasLog(params);

      expect(mockSupabase.eq).toHaveBeenCalledWith('tipo_captura', 'partes');
    });

    it('✅ Filtrar por advogado_id', async () => {
      const params: ListarCapturasLogParams = { advogado_id: 123 };
      mockSupabase.range.mockResolvedValue({ data: [mockCapturaLogPending], error: null, count: 1 });

      await listarCapturasLog(params);

      expect(mockSupabase.eq).toHaveBeenCalledWith('advogado_id', 123);
    });

    it('✅ Filtrar por status', async () => {
      const params: ListarCapturasLogParams = { status: 'completed' };
      mockSupabase.range.mockResolvedValue({ data: [mockCapturaLogCompleted], error: null, count: 1 });

      await listarCapturasLog(params);

      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'completed');
    });

    it('✅ Filtrar por período (data_inicio, data_fim)', async () => {
      const params: ListarCapturasLogParams = { data_inicio: '2023-01-01', data_fim: '2023-01-02' };
      mockSupabase.range.mockResolvedValue({ data: [mockCapturaLogPending], error: null, count: 1 });

      await listarCapturasLog(params);

      expect(mockSupabase.gte).toHaveBeenCalledWith('iniciado_em', '2023-01-01T00:00:00.000Z');
      expect(mockSupabase.lte).toHaveBeenCalledWith('iniciado_em', '2023-01-02T23:59:59.999Z');
    });

    it('✅ Paginação (página 1, página 2, limite customizado)', async () => {
      const params: ListarCapturasLogParams = { pagina: 2, limite: 10 };
      mockSupabase.range.mockResolvedValue({ data: [], error: null, count: 15 });

      const result = await listarCapturasLog(params);

      expect(mockSupabase.range).toHaveBeenCalledWith(10, 19);
      expect(result.pagina).toBe(2);
      expect(result.limite).toBe(10);
      expect(result.totalPaginas).toBe(2);
    });

    it('✅ Ordenação (mais recentes primeiro)', async () => {
      mockSupabase.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await listarCapturasLog();

      expect(mockSupabase.order).toHaveBeenCalledWith('iniciado_em', { ascending: false });
    });

    it('✅ Validar metadados de paginação', async () => {
      mockSupabase.range.mockResolvedValue({ data: [], error: null, count: 150 });

      const result = await listarCapturasLog({ limite: 10 });

      expect(result.total).toBe(150);
      expect(result.totalPaginas).toBe(15);
    });

    it('❌ Erro de Supabase', async () => {
      mockSupabase.range.mockResolvedValue({ data: null, error: { message: 'List error' }, count: null });

      await expect(listarCapturasLog()).rejects.toThrow('Erro ao listar histórico de capturas: List error');
    });
  });

  describe('deletarCapturaLog', () => {
    it('✅ Deletar log existente', async () => {
      mockSupabase.delete.mockResolvedValue({ error: null });

      await expect(deletarCapturaLog(1)).resolves.toBeUndefined();

      expect(mockSupabase.from).toHaveBeenCalledWith('capturas_log');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
    });

    it('❌ Erro ao deletar log inexistente (PGRST116)', async () => {
      mockSupabase.delete.mockResolvedValue({ error: { code: 'PGRST116', message: 'Not found' } });

      await expect(deletarCapturaLog(999)).rejects.toThrow('Registro de captura não encontrado');
    });

    it('❌ Erro genérico de Supabase', async () => {
      mockSupabase.delete.mockResolvedValue({ error: { message: 'Delete error' } });

      await expect(deletarCapturaLog(1)).rejects.toThrow('Erro ao deletar registro de captura: Delete error');
    });
  });

  describe('Testes de integração (com ResultadoCapturaPartes)', () => {
    it('✅ Criar log → Atualizar com resultado tipado → Buscar → Validar mongodb_ids array', async () => {
      // Criar
      mockSupabase.single.mockResolvedValueOnce({ data: mockCapturaLogPending, error: null });
      const created = await criarCapturaLog({
        tipo_captura: 'partes',
        advogado_id: 123,
        credencial_ids: [456],
      });

      // Atualizar
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...created, resultado: mockResultadoCapturaPartes },
        error: null,
      });
      const updated = await atualizarCapturaLog(created.id, { resultado: mockResultadoCapturaPartes });

      // Buscar
      mockSupabase.single.mockResolvedValueOnce({ data: updated, error: null });
      const fetched = await buscarCapturaLog(created.id);

      expect(fetched?.resultado).toEqual(mockResultadoCapturaPartes);
      expect((fetched?.resultado as ResultadoCapturaPartes).mongodb_ids).toEqual(['mongo1', 'mongo2']);
    });

    it('✅ Criar log → Atualizar com mongodb_falhas → Validar contador', async () => {
      // Criar
      mockSupabase.single.mockResolvedValueOnce({ data: mockCapturaLogPending, error: null });
      const created = await criarCapturaLog({
        tipo_captura: 'partes',
        advogado_id: 123,
        credencial_ids: [456],
      });

      // Atualizar
      const resultadoComFalhas = { ...mockResultadoCapturaPartes, mongodb_falhas: 2 };
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...created, resultado: resultadoComFalhas },
        error: null,
      });
      const updated = await atualizarCapturaLog(created.id, { resultado: resultadoComFalhas });

      expect((updated.resultado as ResultadoCapturaPartes).mongodb_falhas).toBe(2);
    });
  });
});