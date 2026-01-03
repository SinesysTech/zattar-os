import type {
  Endereco,
  ListarEnderecosResult,
  EntidadeTipoEndereco,
  SituacaoEndereco,
} from '../types';

export function criarEnderecoMock(overrides: Partial<Endereco> = {}): Endereco {
  return {
    id: 1,
    id_pje: null,
    entidade_tipo: 'cliente',
    entidade_id: 100,
    trt: null,
    grau: null,
    numero_processo: null,
    logradouro: 'Rua das Flores',
    numero: '123',
    complemento: 'Apto 45',
    bairro: 'Centro',
    id_municipio_pje: null,
    municipio: 'São Paulo',
    municipio_ibge: '3550308',
    estado_id_pje: null,
    estado_sigla: 'SP',
    estado_descricao: 'São Paulo',
    estado: 'SP',
    pais_id_pje: null,
    pais_codigo: 'BR',
    pais_descricao: 'Brasil',
    pais: 'Brasil',
    cep: '01310100',
    classificacoes_endereco: null,
    correspondencia: true,
    situacao: 'A',
    dados_pje_completo: null,
    id_usuario_cadastrador_pje: null,
    data_alteracao_pje: null,
    ativo: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function criarListarEnderecosResultMock(
  numeroEnderecos: number = 2,
  overrides: Partial<ListarEnderecosResult> = {}
): ListarEnderecosResult {
  const enderecos = Array.from({ length: numeroEnderecos }, (_, index) =>
    criarEnderecoMock({
      id: index + 1,
      logradouro: `Rua ${index + 1}`,
    })
  );

  return {
    enderecos,
    total: numeroEnderecos,
    pagina: 1,
    limite: 50,
    totalPaginas: 1,
    ...overrides,
  };
}

export const mockEntidadeTipo: Record<string, EntidadeTipoEndereco> = {
  cliente: 'cliente',
  parte_contraria: 'parte_contraria',
  terceiro: 'terceiro',
};

export const mockSituacaoEndereco: Record<string, SituacaoEndereco> = {
  ativo: 'A',
  inativo: 'I',
  principal: 'P',
  historico: 'H',
};
