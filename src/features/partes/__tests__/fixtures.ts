export const criarClienteMock = (overrides = {}) => ({
  id: 1,
  nome: 'Cliente Teste',
  tipo_pessoa: 'pf' as const,
  cpf: '12345678900',
  cnpj: null,
  emails: ['cliente@example.com'],
  ddd_celular: '11',
  numero_celular: '987654321',
  ativo: true,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const criarVinculoProcessoParteMock = (overrides = {}) => ({
  id: 1,
  processo_id: 100,
  tipo_entidade: 'cliente' as const,
  entidade_id: 1,
  id_pje: 12345,
  id_pessoa_pje: 67890,
  tipo_parte: 'RECLAMANTE' as const,
  polo: 'ATIVO' as const,
  trt: 'TRT02',
  grau: '1',
  numero_processo: '0001234-56.2023.5.02.0001',
  principal: true,
  ordem: 1,
  dados_pje_completo: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const criarParteContrariaMock = (overrides = {}) => ({
  id: 1,
  nome: 'Parte Contrária Teste',
  tipo_pessoa: 'pj' as const,
  cpf: null,
  cnpj: '12345678000190',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const criarRepresentanteMock = (overrides = {}) => ({
  id: 1,
  nome: 'Advogado Teste',
  tipo: 'ADVOGADO' as const,
  oabs: [
    {
      numero: '123456',
      uf: 'SP',
      principal: true,
    },
  ],
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const criarTerceiroMock = (overrides = {}) => ({
  id: 1,
  nome: 'Terceiro Teste',
  tipo_pessoa: 'pf' as const,
  cpf: '98765432100',
  cnpj: null,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});
