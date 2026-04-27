import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { obterResumoUltimaCaptura } from '../../repository';

// Helper: mock encadeável com controle de resultados sequenciais
function createSequentialMock(results: { data?: unknown; error: unknown; count?: number | null }[]) {
  let callCount = 0;
  const chain: Record<string, jest.Mock> = {};
  const returnChain = () => chain;

  chain.from = jest.fn(returnChain);
  chain.select = jest.fn(returnChain);
  chain.eq = jest.fn(returnChain);
  chain.gte = jest.fn(returnChain);
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

  it('retorna ok(null) quando não há captura com status completed', async () => {
    mockDb = createSequentialMock([
      { data: null, error: null }, // maybeSingle() → nenhuma captura
    ]);

    const result = await obterResumoUltimaCaptura();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
    expect(mockDb.eq).toHaveBeenCalledWith('status', 'completed');
  });

  it('distingue expedientes criados dos atualizados com base em created_at', async () => {
    const capturaRow = {
      id: 7,
      tipo_captura: 'expedientes_no_prazo',
      iniciado_em: '2026-04-27T10:00:00Z',
      concluido_em: '2026-04-27T10:30:00Z',
    };

    mockDb = createSequentialMock([
      { data: capturaRow, error: null },      // maybeSingle() → captura encontrada
      { data: null, error: null, count: 5 },  // Promise.all[0] → total com ultima_captura_id=7
      { data: null, error: null, count: 3 },  // Promise.all[1] → criados (created_at >= iniciado_em)
    ]);

    const result = await obterResumoUltimaCaptura();

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.capturaId).toBe(7);
      expect(result.data.tipoCaptura).toBe('expedientes_no_prazo');
      expect(result.data.concluidoEm).toBe('2026-04-27T10:30:00Z');
      expect(result.data.total).toBe(5);
      expect(result.data.totalCriados).toBe(3);
      expect(result.data.totalAtualizados).toBe(2);
    }
  });

  it('trata count null como zero', async () => {
    const capturaRow = {
      id: 1,
      tipo_captura: 'captura_combinada',
      iniciado_em: '2026-04-26T08:00:00Z',
      concluido_em: '2026-04-26T09:00:00Z',
    };

    mockDb = createSequentialMock([
      { data: capturaRow, error: null },
      { data: null, error: null, count: null }, // count nulo → deve tratar como 0
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

  it('retorna err quando capturas_log retorna erro do banco', async () => {
    mockDb = createSequentialMock([
      { data: null, error: { message: 'connection timeout' } },
    ]);

    // Sobreescrever maybeSingle para retornar o erro
    mockDb.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'connection timeout' } });

    const result = await obterResumoUltimaCaptura();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
    }
  });

  it('aplica filtro eq("ultima_captura_id", capturaId) nas queries de contagem', async () => {
    const capturaRow = {
      id: 42,
      tipo_captura: 'expedientes_sem_prazo',
      iniciado_em: '2026-04-27T12:00:00Z',
      concluido_em: '2026-04-27T12:45:00Z',
    };

    mockDb = createSequentialMock([
      { data: capturaRow, error: null },
      { data: null, error: null, count: 10 },
      { data: null, error: null, count: 6 },
    ]);

    await obterResumoUltimaCaptura();

    // eq é chamado múltiplas vezes: uma para status='completed', duas para ultima_captura_id
    const eqCalls = (mockDb.eq as jest.Mock).mock.calls;
    const capturaIdCalls = eqCalls.filter(([col]) => col === 'ultima_captura_id');
    expect(capturaIdCalls).toHaveLength(2);
    expect(capturaIdCalls[0][1]).toBe(42);
    expect(capturaIdCalls[1][1]).toBe(42);
  });
});
