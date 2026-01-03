import type { DashboardData } from '../types';

export function criarClienteMock(overrides: Partial<{ nome: string; cpf: string }> = {}) {
  return {
    nome: 'João da Silva',
    cpf: '12345678900',
    ...overrides,
  };
}

export function criarProcessoMock(overrides: Partial<any> = {}): any {
  return {
    id: 1,
    numeroProcesso: '0001234-56.2023.5.02.0001',
    nomeParteAutora: 'João da Silva',
    nomeParteRe: 'Empresa XPTO Ltda',
    ...overrides,
  } as any;
}

export function criarContratoMock(overrides: Partial<any> = {}): any {
  return {
    id: 1,
    clienteId: 100,
    tipo: 'honorarios',
    valorTotal: 5000,
    ...overrides,
  } as any;
}

export function criarAudienciaMock(overrides: Partial<any> = {}): any {
  return {
    id: 1,
    dataHora: '2024-12-15T10:00:00Z',
    tipo: 'Instrução',
    ...overrides,
  } as any;
}

export function criarPagamentoMock(overrides: Partial<any> = {}): any {
  return {
    id: 1,
    valorTotal: 10000,
    parcelas: [],
    ...overrides,
  } as any;
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
