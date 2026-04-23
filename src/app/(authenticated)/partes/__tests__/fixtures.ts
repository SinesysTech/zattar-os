/**
 * Fixtures canônicas para testes do módulo partes.
 *
 * REGRAS:
 * - Todas as entidades seguem o domain real (`../domain.ts`) em snake_case.
 * - `tipo_pessoa` sempre lowercase ('pf' | 'pj'), como o discriminated union exige.
 * - DB mocks (`*DbMock`) podem simular dados legacy com tipo_pessoa em maiúsculas
 *   para validar normalização pelos converters.
 */
import type {
  ClientePessoaFisica,
  ClientePessoaJuridica,
  ParteContrariaPessoaFisica,
  ParteContrariaPessoaJuridica,
  Terceiro,
  TerceiroPessoaFisica,
  TerceiroPessoaJuridica,
} from '../domain';

// =============================================================================
// CLIENTE - Fixtures tipadas (produzem entidades reais do domain)
// =============================================================================

const clienteBaseDefaults = {
  nome_social_fantasia: null,
  emails: ['cliente@example.com'],
  ddd_celular: '11',
  numero_celular: '987654321',
  ddd_residencial: null,
  numero_residencial: null,
  ddd_comercial: null,
  numero_comercial: null,
  tipo_documento: null,
  status_pje: null,
  situacao_pje: null,
  login_pje: null,
  autoridade: null,
  observacoes: null,
  dados_anteriores: null,
  endereco_id: null,
  responsavel_id: null,
  ativo: true,
  created_by: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
} as const;

export function criarClientePFMock(
  overrides?: Partial<ClientePessoaFisica>,
): ClientePessoaFisica {
  return {
    ...clienteBaseDefaults,
    id: 1,
    tipo_pessoa: 'pf',
    nome: 'João Silva Santos',
    cpf: '12345678900',
    cnpj: null,
    rg: '12.345.678-9',
    data_nascimento: '1980-05-15',
    genero: 'masculino',
    estado_civil: 'casado',
    nacionalidade: 'Brasileira',
    sexo: 'masculino',
    nome_genitora: 'Maria Silva',
    naturalidade_id_pje: null,
    naturalidade_municipio: null,
    naturalidade_estado_id_pje: null,
    naturalidade_estado_sigla: null,
    uf_nascimento_id_pje: null,
    uf_nascimento_sigla: null,
    uf_nascimento_descricao: null,
    pais_nascimento_id_pje: null,
    pais_nascimento_codigo: null,
    pais_nascimento_descricao: null,
    escolaridade_codigo: null,
    situacao_cpf_receita_id: null,
    situacao_cpf_receita_descricao: null,
    pode_usar_celular_mensagem: null,
    ...overrides,
  };
}

export function criarClientePJMock(
  overrides?: Partial<ClientePessoaJuridica>,
): ClientePessoaJuridica {
  return {
    ...clienteBaseDefaults,
    id: 2,
    tipo_pessoa: 'pj',
    nome: 'Empresa XYZ Ltda',
    cpf: null,
    cnpj: '12345678000190',
    inscricao_estadual: null,
    data_abertura: '2010-01-01',
    data_fim_atividade: null,
    orgao_publico: null,
    tipo_pessoa_codigo_pje: null,
    tipo_pessoa_label_pje: null,
    tipo_pessoa_validacao_receita: null,
    ds_tipo_pessoa: null,
    situacao_cnpj_receita_id: null,
    situacao_cnpj_receita_descricao: null,
    ramo_atividade: null,
    cpf_responsavel: null,
    oficial: null,
    ds_prazo_expediente_automatico: null,
    porte_codigo: null,
    porte_descricao: null,
    ultima_atualizacao_pje: null,
    ...overrides,
  };
}

// DB mock: simula row bruto do Supabase (inclui caso legacy com tipo_pessoa UPPERCASE)
export function criarClienteDbMock(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    id: 1,
    tipo_pessoa: 'pf',
    nome: 'João Silva Santos',
    nome_social_fantasia: null,
    cpf: '12345678900',
    cnpj: null,
    rg: '12.345.678-9',
    data_nascimento: '1980-05-15',
    genero: 'masculino',
    estado_civil: 'casado',
    nacionalidade: 'Brasileira',
    sexo: 'masculino',
    nome_genitora: 'Maria Silva',
    emails: ['joao.silva@example.com'],
    ddd_celular: '11',
    numero_celular: '987654321',
    ddd_residencial: null,
    numero_residencial: null,
    ddd_comercial: null,
    numero_comercial: null,
    tipo_documento: null,
    status_pje: null,
    situacao_pje: null,
    login_pje: null,
    autoridade: null,
    observacoes: null,
    dados_anteriores: null,
    endereco_id: null,
    responsavel_id: null,
    ativo: true,
    created_by: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// DB mock com tipo_pessoa legacy em MAIÚSCULAS — para validar normalização
export function criarClienteDbLegacyMock(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return criarClienteDbMock({ tipo_pessoa: 'PF', ...overrides });
}

// =============================================================================
// PARTE CONTRÁRIA - Fixtures tipadas
// =============================================================================

const parteContrariaBaseDefaults = {
  nome_social_fantasia: null,
  emails: null,
  ddd_celular: null,
  numero_celular: null,
  ddd_residencial: null,
  numero_residencial: null,
  ddd_comercial: null,
  numero_comercial: null,
  tipo_documento: null,
  status_pje: null,
  situacao_pje: null,
  login_pje: null,
  autoridade: null,
  observacoes: null,
  dados_anteriores: null,
  endereco_id: null,
  ativo: true,
  created_by: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
} as const;

export function criarParteContrariaPFMock(
  overrides?: Partial<ParteContrariaPessoaFisica>,
): ParteContrariaPessoaFisica {
  return {
    ...parteContrariaBaseDefaults,
    id: 1,
    tipo_pessoa: 'pf',
    nome: 'Maria Oliveira',
    cpf: '98765432100',
    cnpj: null,
    rg: null,
    data_nascimento: null,
    genero: null,
    estado_civil: null,
    nacionalidade: null,
    sexo: null,
    nome_genitora: null,
    naturalidade_id_pje: null,
    naturalidade_municipio: null,
    naturalidade_estado_id_pje: null,
    naturalidade_estado_sigla: null,
    uf_nascimento_id_pje: null,
    uf_nascimento_sigla: null,
    uf_nascimento_descricao: null,
    pais_nascimento_id_pje: null,
    pais_nascimento_codigo: null,
    pais_nascimento_descricao: null,
    escolaridade_codigo: null,
    situacao_cpf_receita_id: null,
    situacao_cpf_receita_descricao: null,
    pode_usar_celular_mensagem: null,
    ...overrides,
  };
}

export function criarParteContrariaPJMock(
  overrides?: Partial<ParteContrariaPessoaJuridica>,
): ParteContrariaPessoaJuridica {
  return {
    ...parteContrariaBaseDefaults,
    id: 2,
    tipo_pessoa: 'pj',
    nome: 'Empresa ABC S/A',
    cpf: null,
    cnpj: '98765432000155',
    inscricao_estadual: null,
    data_abertura: null,
    data_fim_atividade: null,
    orgao_publico: null,
    tipo_pessoa_codigo_pje: null,
    tipo_pessoa_label_pje: null,
    tipo_pessoa_validacao_receita: null,
    ds_tipo_pessoa: null,
    situacao_cnpj_receita_id: null,
    situacao_cnpj_receita_descricao: null,
    ramo_atividade: null,
    cpf_responsavel: null,
    oficial: null,
    ds_prazo_expediente_automatico: null,
    porte_codigo: null,
    porte_descricao: null,
    ultima_atualizacao_pje: null,
    ...overrides,
  };
}

export function criarParteContrariaDbMock(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    id: 1,
    tipo_pessoa: 'pf',
    nome: 'Maria Oliveira',
    cpf: '98765432100',
    cnpj: null,
    emails: null,
    ddd_celular: null,
    numero_celular: null,
    observacoes: null,
    endereco_id: null,
    ativo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// =============================================================================
// TERCEIRO - Fixtures tipadas
// =============================================================================

const terceiroBaseDefaults = {
  id_tipo_parte: null,
  tipo_parte: 'RECLAMANTE' as Terceiro['tipo_parte'],
  polo: 'ATIVO' as Terceiro['polo'],
  nome_fantasia: null,
  emails: null,
  ddd_celular: null,
  numero_celular: null,
  ddd_residencial: null,
  numero_residencial: null,
  ddd_comercial: null,
  numero_comercial: null,
  principal: null,
  autoridade: null,
  endereco_desconhecido: null,
  status_pje: null,
  situacao_pje: null,
  login_pje: null,
  ordem: null,
  observacoes: null,
  dados_anteriores: null,
  ativo: true,
  endereco_id: null,
  ultima_atualizacao_pje: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
} as const;

export function criarTerceiroPFMock(
  overrides?: Partial<TerceiroPessoaFisica>,
): TerceiroPessoaFisica {
  return {
    ...terceiroBaseDefaults,
    id: 1,
    tipo_pessoa: 'pf',
    nome: 'Pedro Costa',
    cpf: '11122233344',
    cnpj: null,
    tipo_documento: null,
    rg: null,
    sexo: null,
    nome_genitora: null,
    data_nascimento: null,
    genero: null,
    estado_civil: null,
    nacionalidade: null,
    uf_nascimento_id_pje: null,
    uf_nascimento_sigla: null,
    uf_nascimento_descricao: null,
    naturalidade_id_pje: null,
    naturalidade_municipio: null,
    naturalidade_estado_id_pje: null,
    naturalidade_estado_sigla: null,
    pais_nascimento_id_pje: null,
    pais_nascimento_codigo: null,
    pais_nascimento_descricao: null,
    escolaridade_codigo: null,
    situacao_cpf_receita_id: null,
    situacao_cpf_receita_descricao: null,
    pode_usar_celular_mensagem: null,
    ...overrides,
  };
}

export function criarTerceiroPJMock(
  overrides?: Partial<TerceiroPessoaJuridica>,
): TerceiroPessoaJuridica {
  return {
    ...terceiroBaseDefaults,
    id: 2,
    tipo_pessoa: 'pj',
    nome: 'Escritório Silva & Santos',
    cpf: null,
    cnpj: '22333444000155',
    inscricao_estadual: null,
    data_abertura: null,
    data_fim_atividade: null,
    orgao_publico: null,
    tipo_pessoa_codigo_pje: null,
    tipo_pessoa_label_pje: null,
    tipo_pessoa_validacao_receita: null,
    ds_tipo_pessoa: null,
    situacao_cnpj_receita_id: null,
    situacao_cnpj_receita_descricao: null,
    ramo_atividade: null,
    cpf_responsavel: null,
    oficial: null,
    ds_prazo_expediente_automatico: null,
    porte_codigo: null,
    porte_descricao: null,
    ...overrides,
  };
}

export function criarTerceiroDbMock(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    id: 1,
    tipo_pessoa: 'pf',
    tipo_parte: 'RECLAMANTE',
    polo: 'ATIVO',
    nome: 'Pedro Costa',
    cpf: '11122233344',
    cnpj: null,
    emails: null,
    observacoes: null,
    ativo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// =============================================================================
// ENDEREÇO - Fixture DB
// =============================================================================

export function criarEnderecoDbMock(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    id: 1,
    entidade_tipo: 'cliente',
    entidade_id: 1,
    cep: '01310-100',
    logradouro: 'Avenida Paulista',
    numero: '1578',
    complemento: 'Conjunto 101',
    bairro: 'Bela Vista',
    municipio: 'São Paulo',
    estado_sigla: 'SP',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// =============================================================================
// PROCESSO PARTES - Fixture DB
// =============================================================================

export function criarProcessoPartesDbMock(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    id: 1,
    processo_id: 100,
    entidade_tipo: 'cliente',
    entidade_id: 1,
    tipo_participacao: 'autor',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// =============================================================================
// Legacy helpers (compat para testes antigos, não expandir)
// =============================================================================

export const criarClienteMock = criarClientePFMock;

export const criarVinculoProcessoParteMock = (overrides: Record<string, unknown> = {}) => ({
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

export const criarParteContrariaMock = criarParteContrariaPFMock;

export const criarRepresentanteMock = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  nome: 'Advogado Teste',
  tipo: 'ADVOGADO' as const,
  oabs: [{ numero: '123456', uf: 'SP', principal: true }],
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const criarTerceiroMock = criarTerceiroPFMock;
