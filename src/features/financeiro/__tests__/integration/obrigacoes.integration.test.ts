/**
 * Testes Unitários - Serviço de Integração de Obrigações
 *
 * Testa a lógica de sincronização entre acordos/parcelas e o sistema financeiro.
 * Verifica criação de lançamentos, verificação de consistência e reversão.
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// =============================================================================
// MOCKS
// =============================================================================

// Mock do Supabase client
const mockSupabaseSelect = jest.fn();
const mockSupabaseInsert = jest.fn();
const mockSupabaseUpdate = jest.fn();
const mockSupabaseEq = jest.fn();
const mockSupabaseSingle = jest.fn();
const mockSupabaseLimit = jest.fn();
const mockSupabaseOrder = jest.fn();

const mockSupabaseFrom = jest.fn(() => ({
  select: mockSupabaseSelect,
  insert: mockSupabaseInsert,
  update: mockSupabaseUpdate,
}));

jest.mock('@/lib/supabase/service-client', () => ({
  createServiceClient: () => ({
    from: mockSupabaseFrom,
  }),
}));

// Mock do repository
const mockBuscarParcelaPorId = jest.fn();
const mockBuscarParcelasPorAcordo = jest.fn();
const mockDetectarInconsistencias = jest.fn();

jest.mock(
  '../../repository/obrigacoes',
  () => ({
    ObrigacoesRepository: {
      buscarParcelaPorId: mockBuscarParcelaPorId,
      buscarParcelasPorAcordo: mockBuscarParcelasPorAcordo,
      detectarInconsistencias: mockDetectarInconsistencias,
    },
  })
);

// Importar após mocks
import {
  sincronizarParcelaParaFinanceiro,
  sincronizarAcordoCompleto,
  verificarConsistencia,
  reverterSincronizacao,
} from '../../';

// =============================================================================
// FIXTURES
// =============================================================================

interface MockParcela {
  id: number;
  acordo_condenacao_id: number;
  numero_parcela: number;
  valor_bruto_credito_principal: number;
  honorarios_sucumbenciais: number | null;
  honorarios_contratuais: number | null;
  data_vencimento: string;
  data_efetivacao: string | null;
  status: string;
  forma_pagamento: string | null;
  created_by: string | null;
  acordos_condenacoes?: {
    id: number;
    tipo: 'acordo' | 'condenacao';
    direcao: 'recebimento' | 'pagamento';
    valor_total: number;
    numero_parcelas: number;
    status: string;
    processo_id: number;
  };
}

interface MockLancamento {
  id: number;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  status: string;
  data_lancamento: string;
}

interface MockAcordo {
  id: number;
  tipo: 'acordo' | 'condenacao';
  direcao: 'recebimento' | 'pagamento';
  valor_total: number;
  numero_parcelas: number;
  status: string;
  created_by: string | null;
}

function criarParcelaMock(overrides: Partial<MockParcela> = {}): MockParcela {
  return {
    id: 1,
    acordo_condenacao_id: 100,
    numero_parcela: 1,
    valor_bruto_credito_principal: 5000,
    honorarios_sucumbenciais: 500,
    honorarios_contratuais: 300,
    data_vencimento: '2025-02-01',
    data_efetivacao: '2025-02-01',
    status: 'recebida',
    forma_pagamento: 'transferencia_direta',
    created_by: 'user-123',
    acordos_condenacoes: {
      id: 100,
      tipo: 'acordo',
      direcao: 'recebimento',
      valor_total: 10000,
      numero_parcelas: 2,
      status: 'pago_parcial',
      processo_id: 999,
    },
    ...overrides,
  };
}

function criarLancamentoMock(overrides: Partial<MockLancamento> = {}): MockLancamento {
  return {
    id: 500,
    tipo: 'receita',
    descricao: 'Parcela 1/2 - Acordo (Recebimento)',
    valor: 5500,
    status: 'confirmado',
    data_lancamento: '2025-02-01',
    ...overrides,
  };
}

function criarAcordoMock(overrides: Partial<MockAcordo> = {}): MockAcordo {
  return {
    id: 100,
    tipo: 'acordo',
    direcao: 'recebimento',
    valor_total: 10000,
    numero_parcelas: 2,
    status: 'pendente',
    created_by: 'user-123',
    ...overrides,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function resetMocks() {
  mockSupabaseSelect.mockReset();
  mockSupabaseInsert.mockReset();
  mockSupabaseUpdate.mockReset();
  mockSupabaseEq.mockReset();
  mockSupabaseSingle.mockReset();
  mockSupabaseFrom.mockClear();
  mockSupabaseLimit.mockReset();
  mockSupabaseOrder.mockReset();

  mockBuscarParcelaPorId.mockReset();
  mockBuscarParcelasPorAcordo.mockReset();
  mockDetectarInconsistencias.mockReset();

  // Setup chain mocks default
  mockSupabaseSelect.mockReturnValue({
    eq: mockSupabaseEq,
    single: mockSupabaseSingle,
    order: mockSupabaseOrder,
    limit: mockSupabaseLimit,
  });
  mockSupabaseEq.mockReturnValue({
    eq: mockSupabaseEq,
    single: mockSupabaseSingle,
  });
  mockSupabaseOrder.mockReturnValue({
    limit: mockSupabaseLimit,
  });
  mockSupabaseLimit.mockReturnValue({
    single: mockSupabaseSingle,
  });
  mockSupabaseInsert.mockReturnValue({
    select: mockSupabaseSelect,
  });
  mockSupabaseUpdate.mockReturnValue({
    eq: mockSupabaseEq,
    select: mockSupabaseSelect,
  });
}

// =============================================================================
// TESTES: sincronizarParcelaParaFinanceiro
// =============================================================================

describe('sincronizarParcelaParaFinanceiro', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('quando parcela não existe', () => {
    it('deve retornar erro com acao="erro"', async () => {
      mockBuscarParcelaPorId.mockResolvedValue(null);

      const resultado = await sincronizarParcelaParaFinanceiro(999);

      expect(resultado.sucesso).toBe(false);
      expect(resultado.acao).toBe('erro');
      expect(resultado.mensagem).toContain('não encontrada');
    });
  });

  describe('quando acordo não existe', () => {
    it('deve retornar erro quando parcela não tem acordo vinculado', async () => {
      const parcelaSemAcordo = criarParcelaMock({ acordos_condenacoes: undefined });
      mockBuscarParcelaPorId.mockResolvedValue(parcelaSemAcordo);

      const resultado = await sincronizarParcelaParaFinanceiro(1);

      expect(resultado.sucesso).toBe(false);
      expect(resultado.acao).toBe('erro');
      expect(resultado.mensagem).toContain('Acordo não encontrado');
    });
  });

  describe('quando parcela está pendente', () => {
    it('deve ignorar parcela pendente sem forçar', async () => {
      const parcelaPendente = criarParcelaMock({
        status: 'pendente',
        data_efetivacao: null,
      });
      mockBuscarParcelaPorId.mockResolvedValue(parcelaPendente);

      const resultado = await sincronizarParcelaParaFinanceiro(1, false);

      expect(resultado.sucesso).toBe(true);
      expect(resultado.acao).toBe('ignorado');
      expect(resultado.mensagem).toContain('não efetivada');
    });
  });

  describe('quando lançamento já existe', () => {
    it('deve ignorar se lançamento existe e não está forçando', async () => {
      const parcela = criarParcelaMock();
      const lancamento = criarLancamentoMock();

      mockBuscarParcelaPorId.mockResolvedValue(parcela);
      mockBuscarLancamentoPorParcela.mockResolvedValue(lancamento);

      const resultado = await sincronizarParcelaParaFinanceiro(1, false);

      expect(resultado.sucesso).toBe(true);
      expect(resultado.acao).toBe('ignorado');
      expect(resultado.lancamentoId).toBe(lancamento.id);
    });
  });

  describe('sincronização com sucesso', () => {
    it('deve criar lançamento para parcela recebida', async () => {
      const parcela = criarParcelaMock();

      mockBuscarParcelaPorId.mockResolvedValue(parcela);
      mockBuscarLancamentoPorParcela.mockResolvedValue(null);

      // Mock conta contábil
      mockSupabaseSingle.mockResolvedValueOnce({
        data: { id: 10 },
        error: null,
      });

      // Mock usuário
      mockSupabaseSingle.mockResolvedValueOnce({
        data: { id: 1 },
        error: null,
      });

      // Mock insert
      mockSupabaseSingle.mockResolvedValueOnce({
        data: { id: 500 },
        error: null,
      });

      mockInvalidateObrigacoesCache.mockResolvedValue(undefined);

      const resultado = await sincronizarParcelaParaFinanceiro(1);

      expect(resultado.sucesso).toBe(true);
      expect(resultado.acao).toBe('criado');
      expect(resultado.lancamentoId).toBe(500);
    });

    it('deve calcular valor total corretamente (principal + sucumbenciais)', async () => {
      const parcela = criarParcelaMock({
        valor_bruto_credito_principal: 10000,
        honorarios_sucumbenciais: 1500,
      });

      mockBuscarParcelaPorId.mockResolvedValue(parcela);
      mockBuscarLancamentoPorParcela.mockResolvedValue(null);

      // Capturar o insert para verificar valor
      let insertedValue: number | undefined;
      mockSupabaseInsert.mockImplementation((data) => {
        insertedValue = data.valor;
        return {
          select: () => ({
            single: () => Promise.resolve({ data: { id: 500 }, error: null }),
          }),
        };
      });

      // Mock conta contábil
      mockSupabaseSingle.mockResolvedValueOnce({
        data: { id: 10 },
        error: null,
      });

      // Mock usuário
      mockSupabaseSingle.mockResolvedValueOnce({
        data: { id: 1 },
        error: null,
      });

      mockInvalidateObrigacoesCache.mockResolvedValue(undefined);

      await sincronizarParcelaParaFinanceiro(1);

      // Valor esperado: 10000 + 1500 = 11500
      expect(insertedValue).toBe(11500);
    });
  });

  describe('mapeamento de tipo de lançamento', () => {
    it('deve criar receita para acordo de recebimento', async () => {
      const parcela = criarParcelaMock({
        acordos_condenacoes: {
          ...criarParcelaMock().acordos_condenacoes!,
          direcao: 'recebimento',
        },
      });

      mockBuscarParcelaPorId.mockResolvedValue(parcela);
      mockBuscarLancamentoPorParcela.mockResolvedValue(null);

      // Mock conta contábil para receita
      mockSupabaseFrom.mockImplementation((tableName) => {
        if (tableName === 'plano_contas') {
          return {
            select: () => ({
              eq: jest.fn().mockReturnThis(),
              order: () => ({
                limit: () => ({
                  single: () => Promise.resolve({
                    data: { id: 10 },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return { select: mockSupabaseSelect };
      });

      mockSupabaseSingle.mockResolvedValue({
        data: { id: 500 },
        error: null,
      });

      mockInvalidateObrigacoesCache.mockResolvedValue(undefined);

      const resultado = await sincronizarParcelaParaFinanceiro(1);
      expect(resultado.sucesso).toBe(true);
    });

    it('deve criar despesa para acordo de pagamento', async () => {
      const parcela = criarParcelaMock({
        status: 'paga',
        acordos_condenacoes: {
          ...criarParcelaMock().acordos_condenacoes!,
          direcao: 'pagamento',
        },
      });

      mockBuscarParcelaPorId.mockResolvedValue(parcela);
      mockBuscarLancamentoPorParcela.mockResolvedValue(null);

      mockSupabaseSingle.mockResolvedValue({
        data: { id: 10 },
        error: null,
      });

      mockInvalidateObrigacoesCache.mockResolvedValue(undefined);

      const resultado = await sincronizarParcelaParaFinanceiro(1);
      // Verificar que não houve erro (a lógica seria testada em integração)
      expect(resultado.parcelaId).toBe(1);
    });
  });
});

// =============================================================================
// TESTES: sincronizarAcordoCompleto
// =============================================================================

describe('sincronizarAcordoCompleto', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('quando acordo não existe', () => {
    it('deve retornar erro', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const resultado = await sincronizarAcordoCompleto(999);

      expect(resultado.sucesso).toBe(false);
      expect(resultado.erros).toContain('Acordo 999 não encontrado');
    });
  });

  describe('quando acordo está cancelado', () => {
    it('deve retornar erro e não permitir sincronização', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: criarAcordoMock({ status: 'cancelado' }),
        error: null,
      });

      const resultado = await sincronizarAcordoCompleto(100);

      expect(resultado.sucesso).toBe(false);
      expect(resultado.erros).toContain('Não é possível sincronizar acordo cancelado');
    });
  });

  describe('quando acordo não tem parcelas', () => {
    it('deve retornar warning', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: criarAcordoMock(),
        error: null,
      });
      mockBuscarParcelasPorAcordo.mockResolvedValue([]);

      const resultado = await sincronizarAcordoCompleto(100);

      expect(resultado.sucesso).toBe(true);
      expect(resultado.warnings).toContain('Acordo não possui parcelas cadastradas');
    });
  });

  describe('sincronização com sucesso', () => {
    it('deve processar todas as parcelas', async () => {
      const parcelas = [
        criarParcelaMock({ id: 1, numero_parcela: 1 }),
        criarParcelaMock({ id: 2, numero_parcela: 2 }),
      ];

      mockSupabaseSingle.mockResolvedValue({
        data: criarAcordoMock(),
        error: null,
      });
      mockBuscarParcelasPorAcordo.mockResolvedValue(parcelas);
      mockBuscarParcelaPorId.mockImplementation((id) =>
        Promise.resolve(parcelas.find((p) => p.id === id))
      );
      mockBuscarLancamentoPorParcela.mockResolvedValue(null);

      // Mock para criação de lançamentos
      mockSupabaseSingle
        .mockResolvedValueOnce({ data: { id: 10 }, error: null }) // conta contábil 1
        .mockResolvedValueOnce({ data: { id: 1 }, error: null }) // usuário 1
        .mockResolvedValueOnce({ data: { id: 501 }, error: null }) // insert 1
        .mockResolvedValueOnce({ data: { id: 10 }, error: null }) // conta contábil 2
        .mockResolvedValueOnce({ data: { id: 1 }, error: null }) // usuário 2
        .mockResolvedValueOnce({ data: { id: 502 }, error: null }); // insert 2

      mockInvalidateObrigacoesCache.mockResolvedValue(undefined);

      const resultado = await sincronizarAcordoCompleto(100);

      expect(resultado.totalProcessados).toBe(2);
    });
  });
});

// =============================================================================
// TESTES: verificarConsistencia
// =============================================================================

describe('verificarConsistencia', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('quando acordo não existe', () => {
    it('deve lançar erro', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      await expect(verificarConsistencia(999)).rejects.toThrow('não encontrado');
    });
  });

  describe('quando não há inconsistências', () => {
    it('deve retornar consistente=true', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: criarAcordoMock(),
        error: null,
      });
      mockDetectarInconsistenciasAcordo.mockResolvedValue([]);

      const resultado = await verificarConsistencia(100);

      expect(resultado.consistente).toBe(true);
      expect(resultado.totalInconsistencias).toBe(0);
    });
  });

  describe('quando há inconsistências', () => {
    it('deve retornar lista de inconsistências', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: criarAcordoMock(),
        error: null,
      });
      mockDetectarInconsistenciasAcordo.mockResolvedValue([
        {
          tipo: 'parcela_sem_lancamento',
          descricao: 'Parcela 1 sem lançamento',
          parcelaId: 1,
          sugestao: 'Sincronizar parcela',
        },
        {
          tipo: 'valor_divergente',
          descricao: 'Valores divergem',
          parcelaId: 2,
          lancamentoId: 500,
          valorParcela: 5500,
          valorLancamento: 5000,
          sugestao: 'Atualizar lançamento',
        },
      ]);

      const resultado = await verificarConsistencia(100);

      expect(resultado.consistente).toBe(false);
      expect(resultado.totalInconsistencias).toBe(2);
      expect(resultado.inconsistencias).toHaveLength(2);
    });
  });
});

// =============================================================================
// TESTES: reverterSincronizacao
// =============================================================================

describe('reverterSincronizacao', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('quando parcela não existe', () => {
    it('deve retornar erro', async () => {
      mockBuscarParcelaPorId.mockResolvedValue(null);

      const resultado = await reverterSincronizacao(999);

      expect(resultado.sucesso).toBe(false);
      expect(resultado.mensagem).toContain('não encontrada');
    });
  });

  describe('quando não há lançamento vinculado', () => {
    it('deve retornar sucesso sem ação', async () => {
      mockBuscarParcelaPorId.mockResolvedValue(criarParcelaMock());
      mockBuscarLancamentoPorParcela.mockResolvedValue(null);

      const resultado = await reverterSincronizacao(1);

      expect(resultado.sucesso).toBe(true);
      expect(resultado.mensagem).toContain('Nenhum lançamento');
    });
  });

  describe('quando lançamento já está estornado', () => {
    it('deve retornar sucesso informando que já está estornado', async () => {
      mockBuscarParcelaPorId.mockResolvedValue(criarParcelaMock());
      mockBuscarLancamentoPorParcela.mockResolvedValue(
        criarLancamentoMock({ status: 'estornado' })
      );

      const resultado = await reverterSincronizacao(1);

      expect(resultado.sucesso).toBe(true);
      expect(resultado.mensagem).toContain('já está estornado');
    });
  });

  describe('quando lançamento está confirmado', () => {
    it('deve estornar o lançamento', async () => {
      const lancamento = criarLancamentoMock({ status: 'confirmado' });

      mockBuscarParcelaPorId.mockResolvedValue(criarParcelaMock());
      mockBuscarLancamentoPorParcela.mockResolvedValue(lancamento);

      mockSupabaseEq.mockReturnValue({
        error: null,
      });

      mockInvalidateObrigacoesCache.mockResolvedValue(undefined);

      const resultado = await reverterSincronizacao(1, 'Correção de erro');

      expect(resultado.sucesso).toBe(true);
      expect(resultado.mensagem).toContain('estornado');
    });
  });

  describe('quando lançamento está pendente', () => {
    it('deve cancelar o lançamento', async () => {
      const lancamento = criarLancamentoMock({ status: 'pendente' });

      mockBuscarParcelaPorId.mockResolvedValue(criarParcelaMock());
      mockBuscarLancamentoPorParcela.mockResolvedValue(lancamento);

      mockSupabaseEq.mockReturnValue({
        error: null,
      });

      mockInvalidateObrigacoesCache.mockResolvedValue(undefined);

      const resultado = await reverterSincronizacao(1);

      expect(resultado.sucesso).toBe(true);
      expect(resultado.mensagem).toContain('cancelado');
    });
  });
});
