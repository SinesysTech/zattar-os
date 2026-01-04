import type { DashboardData, ProcessoPortal, ContratoPortal, AudienciaPortal, PagamentoPortal } from '../types';

export function criarClienteMock(overrides: Partial<{ nome: string; cpf: string }> = {}) {
  return {
    nome: 'João da Silva',
    cpf: '12345678900',
    ...overrides,
  };
}

export function criarProcessoMock(overrides: Partial<ProcessoPortal> = {}): ProcessoPortal {
  return {
    id: 1,
    numeroProcesso: '0001234-56.2023.5.02.0001',
    nomeParteAutora: 'João da Silva',
    nomeParteRe: 'Empresa XPTO Ltda',
    ...overrides,
  } as ProcessoPortal;
}

export function criarContratoMock(overrides: Partial<ContratoPortal> = {}): ContratoPortal {
  return {
    id: 1,
    clienteId: 100,
    tipo: 'honorarios',
    valorTotal: 5000,
    ...overrides,
  } as ContratoPortal;
}

export function criarAudienciaMock(overrides: Partial<AudienciaPortal> = {}): AudienciaPortal {
  return {
    id: 1,
    dataHora: '2024-12-15T10:00:00Z',
    tipo: 'Instrução',
    ...overrides,
  } as AudienciaPortal;
}

export function criarPagamentoMock(overrides: Partial<PagamentoPortal> = {}): PagamentoPortal {
  return {
    id: 1,
    valorTotal: 10000,
    parcelas: [],
    ...overrides,
  } as PagamentoPortal;
}

export function criarDashboardDataMock(
  overrides: Partial<DashboardData> = {}
): DashboardData {
  return {
    cliente: criarClienteMock(),
    processos: [criarProcessoMock({ id: 1 }), criarProcessoMock({ id: 2 })],
    contratos: [criarContratoMock()],
    audiencias: [criarAudienciaMock()],
    pagamentos: [criarPagamentoMock()],
    ...overrides,
  };
}
