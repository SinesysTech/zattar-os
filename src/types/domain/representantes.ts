// Tipos de domínio para Representantes (Advogados)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { TipoPessoa } from './common';

/**
 * Define o polo do representante no processo (versão normalizada em minúsculas).
 */
export type Polo = 'ativo' | 'passivo' | 'outros';

/**
 * Define o tipo de um representante (advogado, procurador, etc.).
 */
export type TipoRepresentante =
  | 'ADVOGADO'
  | 'PROCURADOR'
  | 'DEFENSOR_PUBLICO'
  | 'ADVOGADO_DATIVO'
  | 'OUTRO';

/**
 * Define a situação da inscrição OAB do representante.
 */
export type SituacaoOAB =
  | 'REGULAR'
  | 'SUSPENSO'
  | 'CANCELADO'
  | 'LICENCIADO'
  | 'FALECIDO';

/**
 * Inscrição na OAB.
 * Um advogado pode ter inscrições em múltiplos estados.
 */
export interface InscricaoOAB {
  numero: string;
  uf: string;
  situacao: SituacaoOAB | string;
}

/**
 * Representa um Representante (Advogado) no sistema.
 * Estes são sempre pessoas físicas.
 */
export interface Representante {
  id: number;
  cpf: string;
  nome: string;
  sexo: string | null;
  tipo: string | null; // Refere-se a TipoRepresentante, mas pode ser string para flexibilidade
  /** Array de inscrições na OAB (advogado pode atuar em múltiplos estados) */
  oabs: InscricaoOAB[];
  emails: string[] | null;
  email: string | null;
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_residencial: string | null;
  numero_residencial: string | null;
  ddd_comercial: string | null;
  numero_comercial: string | null;
  endereco_id: number | null;
  dados_anteriores: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}
