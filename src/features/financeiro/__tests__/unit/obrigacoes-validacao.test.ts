/**
 * Testes Unitários - Serviço de Validação de Obrigações
 *
 * Testa as validações antes da sincronização entre acordos e sistema financeiro.
 * Verifica regras de negócio, validações de dados e estados.
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// =============================================================================
// MOCKS
// =============================================================================

// Mock do Supabase client
const mockSupabaseSelect = jest.fn();
const mockSupabaseEq = jest.fn();
const mockSupabaseSingle = jest.fn();
const mockSupabaseLimit = jest.fn();
const mockSupabaseOrder = jest.fn();

const mockSupabaseFrom = jest.fn(() => ({
  select: mockSupabaseSelect,
}));

jest.mock('@/lib/supabase/service-client', () => ({
  createServiceClient: () => ({
    from: mockSupabaseFrom,
  }),
}));

// Importar após mocks
import {
  validarSincronizacaoParcela,
  validarSincronizacaoAcordo,
  formatarResultadoValidacao,
} from '../../';

// =============================================================================
// FIXTURES
// =============================================================================

interface MockParcelaDb {
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
}

interface MockAcordoDb {
  id: number;
  tipo: string;
  direcao: string;
  valor_total: number;
  numero_parcelas: number;
  status: string;
  created_by: string | null;
  processo_id: number;
}

function criarParcelaDbMock(overrides: Partial<MockParcelaDb> = {}): MockParcelaDb {
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
    ...overrides,
  };
}

function criarAcordoDbMock(overrides: Partial<MockAcordoDb> = {}): MockAcordoDb {
  return {
    id: 100,
    tipo: 'acordo',
    direcao: 'recebimento',
    valor_total: 10000,
    numero_parcelas: 2,
    status: 'pendente',
    created_by: 'user-123',
    processo_id: 999,
    ...overrides,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function resetMocks() {
  mockSupabaseSelect.mockReset();
  mockSupabaseEq.mockReset();
  mockSupabaseSingle.mockReset();
  mockSupabaseFrom.mockClear();
  mockSupabaseLimit.mockReset();
  mockSupabaseOrder.mockReset();

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
    order: mockSupabaseOrder,
    limit: mockSupabaseLimit,
  });
  mockSupabaseOrder.mockReturnValue({
    limit: mockSupabaseLimit,
  });
  mockSupabaseLimit.mockReturnValue({
    single: mockSupabaseSingle,
  });
}

function setupMockChain(responses: Array<{ data: unknown; error: unknown }>) {
  let callIndex = 0;
  mockSupabaseSingle.mockImplementation(() => {
    const response = responses[callIndex] || { data: null, error: null };
    callIndex++;
    return Promise.resolve(response);
  });
}

// =============================================================================
// TESTES: validarSincronizacaoParcela
// =============================================================================

describe('validarSincronizacaoParcela', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validação de existência da parcela', () => {
    it('deve falhar quando parcela não existe', async () => {
      setupMockChain([
        { data: null, error: { code: 'PGRST116', message: 'Not found' } },
      ]);

      const resultado = await validarSincronizacaoParcela(999);

      expect(resultado.valido).toBe(false);
      expect(resultado.podeProsseguir).toBe(false);
      expect(resultado.erros.some((e) => e.tipo === 'parcela_existe')).toBe(true);
    });

    it('deve passar quando parcela existe', async () => {
      const parcela = criarParcelaDbMock();
      const acordo = criarAcordoDbMock();
      const contaContabil = { id: 10, codigo: '3.1.1', nome: 'Honorários' };

      setupMockChain([
        { data: parcela, error: null }, // parcela existe
        { data: acordo, error: null }, // acordo existe
        { data: contaContabil, error: null }, // conta contábil
        { data: null, error: { code: 'PGRST116' } }, // sem lançamento existente
      ]);

      const resultado = await validarSincronizacaoParcela(1);

      expect(resultado.erros.filter((e) => e.tipo === 'parcela_existe' && !e.valido)).toHaveLength(0);
    });
  });

  describe('validação de existência do acordo', () => {
    it('deve falhar quando acordo da parcela não existe', async () => {
      const parcela = criarParcelaDbMock();

      setupMockChain([
        { data: parcela, error: null }, // parcela existe
        { data: null, error: { code: 'PGRST116', message: 'Not found' } }, // acordo não existe
      ]);

      const resultado = await validarSincronizacaoParcela(1);

      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.tipo === 'acordo_existe')).toBe(true);
    });
  });

  describe('validação de status do acordo', () => {
    it('deve falhar quando acordo está cancelado', async () => {
      const parcela = criarParcelaDbMock();
      const acordoCancelado = criarAcordoDbMock({ status: 'cancelado' });

      setupMockChain([
        { data: parcela, error: null },
        { data: acordoCancelado, error: null },
      ]);

      const resultado = await validarSincronizacaoParcela(1);

      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.tipo === 'acordo_status_valido')).toBe(true);
    });

    it('deve emitir aviso quando acordo já está pago total', async () => {
      const parcela = criarParcelaDbMock();
      const acordoPagoTotal = criarAcordoDbMock({ status: 'pago_total' });
      const contaContabil = { id: 10, codigo: '3.1.1', nome: 'Honorários' };

      setupMockChain([
        { data: parcela, error: null },
        { data: acordoPagoTotal, error: null },
        { data: contaContabil, error: null },
        { data: null, error: { code: 'PGRST116' } },
      ]);

      const resultado = await validarSincronizacaoParcela(1, false);

      // Deve ter um aviso sobre o status
      expect(resultado.avisos.some((a) => a.tipo === 'acordo_status_valido')).toBe(true);
    });
  });

  describe('validação de status da parcela', () => {
    it('deve ignorar parcela pendente sem forçar', async () => {
      const parcelaPendente = criarParcelaDbMock({ status: 'pendente' });
      const acordo = criarAcordoDbMock();
      const contaContabil = { id: 10, codigo: '3.1.1', nome: 'Honorários' };

      setupMockChain([
        { data: parcelaPendente, error: null },
        { data: acordo, error: null },
        { data: contaContabil, error: null },
        { data: null, error: { code: 'PGRST116' } },
      ]);

      const resultado = await validarSincronizacaoParcela(1, false);

      // Parcela pendente deve ter info sobre ser ignorada
      const infoParcelaStatus = resultado.info.find((i) => i.tipo === 'parcela_status_valido');
      expect(infoParcelaStatus?.detalhes).toHaveProperty('ignorar', true);
    });

    it('deve permitir parcela pendente quando forçando', async () => {
      const parcelaPendente = criarParcelaDbMock({ status: 'pendente' });
      const acordo = criarAcordoDbMock();
      const contaContabil = { id: 10, codigo: '3.1.1', nome: 'Honorários' };

      setupMockChain([
        { data: parcelaPendente, error: null },
        { data: acordo, error: null },
        { data: contaContabil, error: null },
        { data: null, error: { code: 'PGRST116' } },
      ]);

      const resultado = await validarSincronizacaoParcela(1, true);

      // Deve ter aviso sobre forçar, não erro
      const avisoParcelaStatus = resultado.avisos.find((a) => a.tipo === 'parcela_status_valido');
      expect(avisoParcelaStatus?.detalhes).toHaveProperty('forcado', true);
    });
  });

  describe('validação de valores', () => {
    it('deve falhar quando valor principal é zero ou negativo', async () => {
      const parcelaValorZero = criarParcelaDbMock({
        valor_bruto_credito_principal: 0,
      });
      const acordo = criarAcordoDbMock();

      setupMockChain([
        { data: parcelaValorZero, error: null },
        { data: acordo, error: null },
      ]);

      const resultado = await validarSincronizacaoParcela(1);

      expect(resultado.erros.some((e) => e.tipo === 'valores_validos')).toBe(true);
    });

    it('deve passar quando valores são válidos', async () => {
      const parcela = criarParcelaDbMock({
        valor_bruto_credito_principal: 5000,
        honorarios_sucumbenciais: 500,
        honorarios_contratuais: 300,
      });
      const acordo = criarAcordoDbMock();
      const contaContabil = { id: 10, codigo: '3.1.1', nome: 'Honorários' };

      setupMockChain([
        { data: parcela, error: null },
        { data: acordo, error: null },
        { data: contaContabil, error: null },
        { data: null, error: { code: 'PGRST116' } },
      ]);

      const resultado = await validarSincronizacaoParcela(1);

      // Não deve ter erro de valores
      expect(resultado.erros.filter((e) => e.tipo === 'valores_validos' && !e.valido)).toHaveLength(0);
    });
  });

  describe('validação de conta contábil', () => {
    it('deve falhar quando não existe conta contábil padrão', async () => {
      const parcela = criarParcelaDbMock();
      const acordo = criarAcordoDbMock();

      setupMockChain([
        { data: parcela, error: null },
        { data: acordo, error: null },
        { data: null, error: { code: 'PGRST116', message: 'Not found' } }, // sem conta
      ]);

      const resultado = await validarSincronizacaoParcela(1);

      expect(resultado.erros.some((e) => e.tipo === 'conta_contabil_existe')).toBe(true);
    });
  });

  describe('validação de lançamento existente', () => {
    it('deve informar quando lançamento já existe', async () => {
      const parcela = criarParcelaDbMock();
      const acordo = criarAcordoDbMock();
      const contaContabil = { id: 10, codigo: '3.1.1', nome: 'Honorários' };
      const lancamentoExistente = { id: 500, status: 'confirmado', valor: 5500 };

      setupMockChain([
        { data: parcela, error: null },
        { data: acordo, error: null },
        { data: contaContabil, error: null },
        { data: lancamentoExistente, error: null },
      ]);

      const resultado = await validarSincronizacaoParcela(1, false);

      const infoLancamento = resultado.info.find(
        (i) => i.tipo === 'lancamento_pode_ser_atualizado' || i.tipo === 'lancamento_pode_ser_criado'
      );
      expect(infoLancamento?.detalhes).toHaveProperty('ignorar', true);
    });

    it('deve permitir atualizar quando forçando', async () => {
      const parcela = criarParcelaDbMock();
      const acordo = criarAcordoDbMock();
      const contaContabil = { id: 10, codigo: '3.1.1', nome: 'Honorários' };
      const lancamentoExistente = { id: 500, status: 'confirmado', valor: 5500 };

      setupMockChain([
        { data: parcela, error: null },
        { data: acordo, error: null },
        { data: contaContabil, error: null },
        { data: lancamentoExistente, error: null },
      ]);

      const resultado = await validarSincronizacaoParcela(1, true);

      // Deve ter aviso sobre atualização
      const avisoLancamento = resultado.avisos.find(
        (a) => a.tipo === 'lancamento_pode_ser_atualizado'
      );
      expect(avisoLancamento).toBeDefined();
    });
  });

  describe('resultado completo', () => {
    it('deve retornar tempo de validação', async () => {
      const parcela = criarParcelaDbMock();
      const acordo = criarAcordoDbMock();
      const contaContabil = { id: 10, codigo: '3.1.1', nome: 'Honorários' };

      setupMockChain([
        { data: parcela, error: null },
        { data: acordo, error: null },
        { data: contaContabil, error: null },
        { data: null, error: { code: 'PGRST116' } },
      ]);

      const resultado = await validarSincronizacaoParcela(1);

      expect(resultado.tempoValidacao).toBeGreaterThanOrEqual(0);
    });

    it('deve contar total de validações', async () => {
      const parcela = criarParcelaDbMock();
      const acordo = criarAcordoDbMock();
      const contaContabil = { id: 10, codigo: '3.1.1', nome: 'Honorários' };

      setupMockChain([
        { data: parcela, error: null },
        { data: acordo, error: null },
        { data: contaContabil, error: null },
        { data: null, error: { code: 'PGRST116' } },
      ]);

      const resultado = await validarSincronizacaoParcela(1);

      // Deve ter várias validações (parcela, acordo, status, valores, datas, conta, lançamento)
      expect(resultado.totalValidacoes).toBeGreaterThan(5);
    });
  });
});

// =============================================================================
// TESTES: validarSincronizacaoAcordo
// =============================================================================

describe('validarSincronizacaoAcordo', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validação de existência do acordo', () => {
    it('deve falhar quando acordo não existe', async () => {
      setupMockChain([
        { data: null, error: { code: 'PGRST116', message: 'Not found' } },
      ]);

      const resultado = await validarSincronizacaoAcordo(999);

      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some((e) => e.tipo === 'acordo_existe')).toBe(true);
    });
  });

  describe('validação de status do acordo', () => {
    it('deve falhar para acordo cancelado', async () => {
      const acordoCancelado = criarAcordoDbMock({ status: 'cancelado' });

      setupMockChain([{ data: acordoCancelado, error: null }]);

      const resultado = await validarSincronizacaoAcordo(100);

      expect(resultado.valido).toBe(false);
      expect(resultado.podeProsseguir).toBe(false);
    });
  });

  describe('validação de conta contábil', () => {
    it('deve falhar quando não há conta contábil configurada', async () => {
      const acordo = criarAcordoDbMock();

      setupMockChain([
        { data: acordo, error: null },
        { data: null, error: { code: 'PGRST116' } }, // sem conta
      ]);

      mockSupabaseFrom.mockImplementation((tableName) => {
        if (tableName === 'parcelas_acordos_condenacoes') {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
          };
        }
        return { select: mockSupabaseSelect };
      });

      const resultado = await validarSincronizacaoAcordo(100);

      expect(resultado.erros.some((e) => e.tipo === 'conta_contabil_existe')).toBe(true);
    });
  });

  describe('validação de parcelas', () => {
    it('deve emitir aviso quando não há parcelas', async () => {
      const acordo = criarAcordoDbMock();
      const contaContabil = { id: 10, codigo: '3.1.1', nome: 'Honorários' };

      setupMockChain([
        { data: acordo, error: null },
        { data: contaContabil, error: null },
      ]);

      mockSupabaseFrom.mockImplementation((tableName) => {
        if (tableName === 'parcelas_acordos_condenacoes') {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
          };
        }
        return { select: mockSupabaseSelect };
      });

      const resultado = await validarSincronizacaoAcordo(100);

      expect(resultado.avisos.some((a) => a.mensagem.includes('não possui parcelas'))).toBe(true);
    });
  });
});

// =============================================================================
// TESTES: formatarResultadoValidacao
// =============================================================================

describe('formatarResultadoValidacao', () => {
  it('deve formatar resultado válido corretamente', () => {
    const resultado = {
      valido: true,
      podeProsseguir: true,
      erros: [],
      avisos: [],
      info: [
        {
          tipo: 'parcela_existe' as const,
          valido: true,
          severidade: 'info' as const,
          mensagem: 'Parcela encontrada',
        },
      ],
      totalValidacoes: 5,
      tempoValidacao: 100,
    };

    const formatado = formatarResultadoValidacao(resultado);

    expect(formatado).toContain('VÁLIDO');
    expect(formatado).toContain('SIM');
    expect(formatado).toContain('5');
    expect(formatado).toContain('100ms');
  });

  it('deve formatar resultado inválido com erros', () => {
    const resultado = {
      valido: false,
      podeProsseguir: false,
      erros: [
        {
          tipo: 'acordo_existe' as const,
          valido: false,
          severidade: 'erro' as const,
          mensagem: 'Acordo não encontrado',
        },
      ],
      avisos: [],
      info: [],
      totalValidacoes: 1,
      tempoValidacao: 50,
    };

    const formatado = formatarResultadoValidacao(resultado);

    expect(formatado).toContain('INVÁLIDO');
    expect(formatado).toContain('NÃO');
    expect(formatado).toContain('ERROS (1)');
    expect(formatado).toContain('Acordo não encontrado');
  });

  it('deve formatar avisos quando presentes', () => {
    const resultado = {
      valido: true,
      podeProsseguir: true,
      erros: [],
      avisos: [
        {
          tipo: 'acordo_status_valido' as const,
          valido: true,
          severidade: 'aviso' as const,
          mensagem: 'Acordo já está pago total',
        },
      ],
      info: [],
      totalValidacoes: 3,
      tempoValidacao: 75,
    };

    const formatado = formatarResultadoValidacao(resultado);

    expect(formatado).toContain('AVISOS (1)');
    expect(formatado).toContain('Acordo já está pago total');
  });
});
