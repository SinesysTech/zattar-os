/**
 * Tipos frontend para Endereços
 * Re-exporta tipos do backend e adiciona utilitários para uso em componentes React
 */

// Re-exporta todos os tipos de endereços do backend
export type {
  EntidadeTipoEndereco,
  SituacaoEndereco,
  ClassificacaoEndereco,
  Endereco,
  CriarEnderecoParams,
  AtualizarEnderecoParams,
  ListarEnderecosParams,
  ListarEnderecosResult,
  BuscarEnderecosPorEntidadeParams,
  DefinirEnderecoPrincipalParams,
  OrdenarPorEndereco,
  OrdemEndereco,
} from '@/backend/types/partes/enderecos-types';

// Tipos auxiliares para formulários
export interface EnderecoFormData {
  // Campos obrigatórios
  entidade_tipo: 'cliente' | 'parte_contraria' | 'terceiro' | 'representante';
  entidade_id: number;

  // Campos opcionais
  id_pje?: number;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  id_municipio_pje?: number;
  municipio?: string;
  municipio_ibge?: string;
  estado_id_pje?: number;
  estado_sigla?: string;
  estado_descricao?: string;
  pais_id_pje?: number;
  pais_codigo?: string;
  pais_descricao?: string;
  cep?: string;
  classificacoes_endereco?: string[];
  correspondencia?: boolean;
  situacao?: 'ATIVO' | 'INATIVO' | 'DESCONHECIDO';
  id_usuario_cadastrador_pje?: number;
  data_alteracao_pje?: string;
  ativo?: boolean;
}

/**
 * Valida se o endereço é de correspondência
 */
export function isEnderecoCorrespondencia(endereco: { correspondencia: boolean | null }): boolean {
  return endereco.correspondencia === true;
}

/**
 * Valida se o endereço está ativo
 */
export function isEnderecoAtivo(endereco: { ativo: boolean | null }): boolean {
  return endereco.ativo !== false;
}

/**
 * Formata CEP para exibição
 */
export function formatarCep(cep: string | null | undefined): string {
  if (!cep) return '';
  const numeros = cep.replace(/\D/g, '');
  if (numeros.length !== 8) return cep;
  return numeros.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Formata endereço completo para exibição
 */
export function formatarEnderecoCompleto(endereco: {
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  estado_sigla?: string | null;
  cep?: string | null;
}): string {
  const partes: string[] = [];

  if (endereco.logradouro) {
    let linha = endereco.logradouro;
    if (endereco.numero) linha += `, ${endereco.numero}`;
    if (endereco.complemento) linha += ` - ${endereco.complemento}`;
    partes.push(linha);
  }

  if (endereco.bairro) partes.push(endereco.bairro);

  if (endereco.municipio || endereco.estado_sigla) {
    let cidadeEstado = '';
    if (endereco.municipio) cidadeEstado += endereco.municipio;
    if (endereco.estado_sigla) {
      if (cidadeEstado) cidadeEstado += '/';
      cidadeEstado += endereco.estado_sigla;
    }
    partes.push(cidadeEstado);
  }

  if (endereco.cep) partes.push(`CEP ${formatarCep(endereco.cep)}`);

  return partes.join(', ');
}

/**
 * Formata endereço resumido (rua, número, bairro)
 */
export function formatarEnderecoResumido(endereco: {
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
}): string {
  const partes: string[] = [];

  if (endereco.logradouro) {
    let linha = endereco.logradouro;
    if (endereco.numero) linha += `, ${endereco.numero}`;
    partes.push(linha);
  }

  if (endereco.bairro) partes.push(endereco.bairro);

  return partes.join(' - ');
}

/**
 * Retorna label de situação do endereço
 */
export function getSituacaoEnderecoLabel(situacao: 'ATIVO' | 'INATIVO' | 'DESCONHECIDO' | null | undefined): string {
  if (!situacao) return 'Desconhecido';
  const labels = {
    ATIVO: 'Ativo',
    INATIVO: 'Inativo',
    DESCONHECIDO: 'Desconhecido',
  };
  return labels[situacao] || 'Desconhecido';
}

/**
 * Retorna cor da badge de situação do endereço
 */
export function getSituacaoEnderecoColor(situacao: 'ATIVO' | 'INATIVO' | 'DESCONHECIDO' | null | undefined): string {
  if (!situacao) return 'default';
  const colors = {
    ATIVO: 'green',
    INATIVO: 'red',
    DESCONHECIDO: 'gray',
  };
  return colors[situacao] || 'default';
}

/**
 * Retorna label do tipo de entidade
 */
export function getEntidadeTipoLabel(tipo: 'cliente' | 'parte_contraria' | 'terceiro' | 'representante'): string {
  const labels = {
    cliente: 'Cliente',
    parte_contraria: 'Parte Contrária',
    terceiro: 'Terceiro',
    representante: 'Representante',
  };
  return labels[tipo] || tipo;
}

/**
 * Valida formato de CEP
 */
export function validarCep(cep: string): boolean {
  const numeros = cep.replace(/\D/g, '');
  return numeros.length === 8;
}

/**
 * Lista de UFs válidas
 */
export const UFS_VALIDAS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

/**
 * Valida UF
 */
export function validarUf(uf: string): boolean {
  return UFS_VALIDAS.includes(uf.toUpperCase());
}

/**
 * Retorna nome completo do estado por sigla
 */
export function getNomeEstado(uf: string): string {
  const estados: Record<string, string> = {
    AC: 'Acre',
    AL: 'Alagoas',
    AP: 'Amapá',
    AM: 'Amazonas',
    BA: 'Bahia',
    CE: 'Ceará',
    DF: 'Distrito Federal',
    ES: 'Espírito Santo',
    GO: 'Goiás',
    MA: 'Maranhão',
    MT: 'Mato Grosso',
    MS: 'Mato Grosso do Sul',
    MG: 'Minas Gerais',
    PA: 'Pará',
    PB: 'Paraíba',
    PR: 'Paraná',
    PE: 'Pernambuco',
    PI: 'Piauí',
    RJ: 'Rio de Janeiro',
    RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul',
    RO: 'Rondônia',
    RR: 'Roraima',
    SC: 'Santa Catarina',
    SP: 'São Paulo',
    SE: 'Sergipe',
    TO: 'Tocantins',
  };
  return estados[uf.toUpperCase()] || uf;
}
