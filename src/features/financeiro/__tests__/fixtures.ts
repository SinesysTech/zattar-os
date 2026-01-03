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
