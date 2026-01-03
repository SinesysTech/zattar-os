// @ts-nocheck
import { Lancamento, TipoLancamento, StatusLancamento, OrigemLancamento } from '../types';

// Lançamento Fixtures
export function criarLancamentoReceitaMock(overrides?: Partial<Lancamento>): Lancamento {
  return {
    id: 1,
    tipo: TipoLancamento.RECEITA,
    descricao: 'Honorários advocatícios - Processo 0001234-56.2023.5.15.0001',
    valor: 5000.00,
    dataVencimento: '2024-02-15',
    dataCompetencia: '2024-02-01',
    status: StatusLancamento.PENDENTE,
    origem: OrigemLancamento.MANUAL,
    pessoaId: 10,
    contaContabilId: 1,
    centroCustoId: 5,
    contaBancariaId: null,
    dataPagamento: null,
    valorPago: null,
    formaPagamento: null,
    observacoes: null,
    recorrente: false,
    frequenciaRecorrencia: null,
    lancamentoOrigemId: null,
    parcelaNumero: null,
    parcelaTotais: null,
    anexos: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function criarLancamentoDespesaMock(overrides?: Partial<Lancamento>): Lancamento {
  return {
    id: 2,
    tipo: TipoLancamento.DESPESA,
    descricao: 'Aluguel - Janeiro 2024',
    valor: 3000.00,
    dataVencimento: '2024-01-10',
    dataCompetencia: '2024-01-01',
    status: StatusLancamento.PAGO,
    origem: OrigemLancamento.MANUAL,
    pessoaId: 20,
    contaContabilId: 2,
    centroCustoId: 3,
    contaBancariaId: 1,
    dataPagamento: '2024-01-10',
    valorPago: 3000.00,
    formaPagamento: 'pix',
    observacoes: 'Pagamento realizado via PIX',
    recorrente: true,
    frequenciaRecorrencia: 'mensal',
    lancamentoOrigemId: null,
    parcelaNumero: null,
    parcelaTotais: null,
    anexos: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T12:00:00Z',
    ...overrides,
  };
}

export function criarLancamentoDbMock(overrides?: Record<string, any>): Record<string, any> {
  return {
    id: 1,
    tipo: 'receita',
    descricao: 'Honorários advocatícios - Processo 0001234-56.2023.5.15.0001',
    valor: 5000.00,
    data_vencimento: '2024-02-15',
    data_competencia: '2024-02-01',
    status: 'pendente',
    origem: 'manual',
    pessoa_id: 10,
    conta_contabil_id: 1,
    centro_custo_id: 5,
    conta_bancaria_id: null,
    data_pagamento: null,
    valor_pago: null,
    forma_pagamento: null,
    observacoes: null,
    recorrente: false,
    frequencia_recorrencia: null,
    lancamento_origem_id: null,
    parcela_numero: null,
    parcela_totais: null,
    anexos: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function criarLancamentoParceladoMock(
  totalParcelas: number,
  parcelaAtual: number
): Lancamento {
  return criarLancamentoReceitaMock({
    id: parcelaAtual,
    descricao: `Honorários parcelados - Parcela ${parcelaAtual}/${totalParcelas}`,
    valor: 1000.00,
    parcelaNumero: parcelaAtual,
    parcelaTotais: totalParcelas,
    lancamentoOrigemId: 100,
  });
}

export function criarResumoVencimentosCompleteMock() {
  return {
    vencidas: {
      quantidade: 5,
      valorTotal: 15000.00,
    },
    hoje: {
      quantidade: 2,
      valorTotal: 8000.00,
    },
    proximos7Dias: {
      quantidade: 10,
      valorTotal: 25000.00,
    },
    proximos30Dias: {
      quantidade: 15,
      valorTotal: 45000.00,
    },
  };
}

// Legacy mocks for backward compatibility
export const criarLancamentoMock = (overrides = {}) => ({
  id: 1,
  tipo: 'receita' as const,
  categoria: 'honorarios',
  descricao: 'Honorários processo X',
  valor: 5000,
  dataVencimento: '2024-01-15',
  dataEfetivacao: null,
  status: 'pendente' as const,
  contaBancariaId: 1,
  processoId: 100,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const criarResumoVencimentosMock = (overrides = {}) => ({
  vencidas: 5,
  valorVencido: 10000,
  vencendoHoje: 2,
  valorVencendoHoje: 3000,
  proximos7Dias: 8,
  valorProximos7Dias: 15000,
  ...overrides,
});

export const criarParcelaMock = (overrides = {}) => ({
  id: 1,
  acordo_id: 1,
  numero: 1,
  valor: 1000,
  data_vencimento: '2024-01-15',
  status: 'pendente' as const,
  sincronizado: false,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const criarAcordoMock = (overrides = {}) => ({
  id: 1,
  processo_id: 100,
  tipo: 'acordo' as const,
  valor_total: 12000,
  numero_parcelas: 12,
  data_acordo: '2024-01-01',
  status: 'ativo' as const,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const criarTransacaoBancariaMock = (overrides = {}) => ({
  id: 1,
  conta_bancaria_id: 1,
  data: '2024-01-15',
  descricao: 'Transferência recebida',
  valor: 5000,
  tipo: 'credito' as const,
  status_conciliacao: 'pendente' as const,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const criarConciliacaoMock = (overrides = {}) => ({
  id: 1,
  transacao_id: 1,
  lancamento_id: 1,
  tipo: 'manual' as const,
  usuario_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const criarRepasseMock = (overrides = {}) => ({
  id: 1,
  parcela_id: 1,
  valor: 1000,
  data_repasse: '2024-01-15',
  comprovante_url: 'https://example.com/comprovante.pdf',
  status: 'realizado' as const,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const criarInconsistenciaMock = (overrides = {}) => ({
  id: 1,
  parcela_id: 1,
  tipo: 'valor_divergente' as const,
  descricao: 'Valor da parcela diverge do lançamento',
  valor_esperado: 1000,
  valor_encontrado: 950,
  resolvido: false,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});
