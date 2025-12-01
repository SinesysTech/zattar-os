import type { GrauProcesso } from './common';
import type { CEP } from './value-objects';

/**
 * Define a que tipo de entidade um endereço está associado.
 * Esta é uma relação polimórfica.
 */
export type EntidadeTipoEndereco = 'cliente' | 'parte_contraria' | 'terceiro';

/**
 * Situação de um endereço, especialmente em sincronia com o PJE.
 * - `A`: Ativo
 * - `I`: Inativo
 * - `P`: Principal (endereço de correspondência)
 * - `H`: Histórico
 */
export type SituacaoEndereco = 'A' | 'I' | 'P' | 'H';

/**
 * Classificação de um endereço (e.g., residencial, comercial).
 */
export interface ClassificacaoEndereco {
  codigo?: string;
  descricao?: string;
}

/**
 * Representa um endereço físico associado a uma entidade (cliente,
 * parte contrária ou terceiro).
 */
export interface Endereco {
  id: number;
  id_pje: number | null;
  entidade_tipo: EntidadeTipoEndereco;
  entidade_id: number;
  trt: string | null;
  grau: GrauProcesso | null;
  numero_processo: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  id_municipio_pje: number | null;
  municipio: string | null;
  municipio_ibge: string | null;
  estado_id_pje: number | null;
  estado_sigla: string | null;
  estado_descricao: string | null;
  estado: string | null;
  pais_id_pje: number | null;
  pais_codigo?: string | null;
  pais_descricao?: string | null;
  pais: string | null;
  cep: CEP | null;
  classificacoes_endereco: ClassificacaoEndereco[] | null;
  correspondencia: boolean | null;
  situacao: SituacaoEndereco | null;
  dados_pje_completo: Record<string, unknown> | null;
  id_usuario_cadastrador_pje: number | null;
  data_alteracao_pje: string | null;
  ativo: boolean | null;
  created_at: string;
  updated_at: string;
}
