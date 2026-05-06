import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { obterResumoUltimaCaptura } from '../../repository';

// Helper: mock encadeável com controle de resultados sequenciais.
// Sequência esperada:
//   1) maybeSingle() em expedientes → { ultima_captura_id }
//   2) maybeSingle() em capturas_log → { id, tipo_captura, iniciado_em, concluido_em }
//   3) Promise.all([count total, count criados]) → resolvidos via .then()
function createSequentialMock(results: { data?: unknown; error: unknown; count?: number | null }[]) {
  let callCount = 0;
  const chain: Record<string, jest.Mock> = {};
  const returnChain = () => chain;

  chain.from = jest.fn(returnChain);
  chain.select = jest.fn(returnChain);
  chain.eq = jest.fn(returnChain);
  chain.gte = jest.fn(returnChain);
  chain.not = jest.fn(returnChain);
  chain.order = jest.fn(returnChain);
  chain.limit = jest.fn(returnChain);
  chain.maybeSingle = jest.fn(() => Promise.resolve(results[callCount++] ?? { data: null, error: null }));
  chain.then = jest.fn((resolve: (v: unknown) => void) => {
    return Promise.resolve(results[callCount++] ?? { data: null, error: null, count: null }).then(resolve);
  });

  return chain;
}

let mockDb: ReturnType<typeof createSequentialMock>;

jest.mock('@/lib/supabase', () => ({
  createDbClient: jest.fn(() => mockDb),
}));

describe('obterResumoUltimaCaptura', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna ok(null) quando nenhum expediente tem ultima_captura_id', async () => {
    mockDb = createSequentialMock([
      { data: null, error: null }, // maybeSingle() em expedientes → nenhum registro
    ]);

    const result = await obterResumoUltimaCaptura();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
    // Verifica que o filtro IS NOT NULL foi aplicado em ultima_captura_id
    expect(mockDb.not).toHaveBeenCalledWith('ultima_captura_id', 'is', null);
  });

  it('distingue expedientes criados dos atualizados com base em created_at', async () => {
    const capturaRow = {
      id: 7,
      tipo_captura: 'pendentes',
      iniciado_em: '2026-04-27T10:00:00Z',
      concluido_em: '2026-04-27T10:30:00Z',
    };

    mockDb = createSequentialMock([
      { data: { ultima_captura_id: 7 }, error: null }, // expedientes → última captura referenciada
      { data: capturaRow, error: null },               // capturas_log → metadados da captura
      { data: null, error: null, count: 5 },           // Promise.all[0] → total
      { data: null, error: null, count: 3 },           // Promise.all[1] → criados
    ]);

    const result = await obterResumoUltimaCaptura();

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.capturaId).toBe(7);
      expect(result.data.tipoCaptura).toBe('pendentes');
      expect(result.data.concluidoEm).toBe('2026-04-27T10:30:00Z');
      expect(result.data.total).toBe(5);
      expect(result.data.totalCriados).toBe(3);
      expect(result.data.totalAtualizados).toBe(2);
    }
  });

  it('aceita captura ainda sem concluido_em (failed parcial / in_progress) e usa iniciado_em como fallback', async () => {
    const capturaRow = {
      id: 11,
      tipo_captura: 'pendentes',
      iniciado_em: '2026-04-28T08:00:00Z',
      concluido_em: null,
    };

    mockDb = createSequentialMock([
      { data: { ultima_captura_id: 11 }, error: null },
      { data: capturaRow, error: null },
      { data: null, error: null, count: 4 },
      { data: null, error: null, count: 4 },
    ]);

    const result = await obterResumoUltimaCaptura();

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.capturaId).toBe(11);
      expect(result.data.concluidoEm).toBe('2026-04-28T08:00:00Z');
      expect(result.data.total).toBe(4);
      expect(result.data.totalCriados).toBe(4);
      expect(result.data.totalAtualizados).toBe(0);
    }
  });

  it('trata count null como zero', async () => {
    const capturaRow = {
      id: 1,
      tipo_captura: 'combinada',
      iniciado_em: '2026-04-26T08:00:00Z',
      concluido_em: '2026-04-26T09:00:00Z',
    };

    mockDb = createSequentialMock([
      { data: { ultima_captura_id: 1 }, error: null },
      { data: capturaRow, error: null },
      { data: null, error: null, count: null },
      { data: null, error: null, count: null },
    ]);

    const result = await obterResumoUltimaCaptura();

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.total).toBe(0);
      expect(result.data.totalCriados).toBe(0);
      expect(result.data.totalAtualizados).toBe(0);
    }
  });

  it('retorna err quando a busca em expedientes falha', async () => {
    mockDb = createSequentialMock([
      { data: null, error: { message: 'connection timeout' } },
    ]);
    mockDb.maybeSingle = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'connection timeout' } });

    const result = await obterResumoUltimaCaptura();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
    }
  });

  it('aplica filtro eq("ultima_captura_id", capturaId) nas queries de contagem', async () => {
    const capturaRow = {
      id: 42,
      tipo_captura: 'pendentes',
      iniciado_em: '2026-04-27T12:00:00Z',
      concluido_em: '2026-04-27T12:45:00Z',
    };

    mockDb = createSequentialMock([
      { data: { ultima_captura_id: 42 }, error: null },
      { data: capturaRow, error: null },
      { data: null, error: null, count: 10 },
      { data: null, error: null, count: 6 },
    ]);

    await obterResumoUltimaCaptura();

    const eqCalls = (mockDb.eq as jest.Mock).mock.calls;
    const capturaIdCalls = eqCalls.filter(([col]) => col === 'ultima_captura_id');
    expect(capturaIdCalls).toHaveLength(2);
    expect(capturaIdCalls[0][1]).toBe(42);
    expect(capturaIdCalls[1][1]).toBe(42);
  });
});
