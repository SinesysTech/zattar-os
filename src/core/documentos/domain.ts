/**
 * Definições de domínio para o módulo de documentos
 */

import type { Descendant } from 'platejs';

/**
 * Tipo principal do Documento
 */
export interface Documento {
  id: number;
  titulo: string;
  conteudo_json: any; // Conteúdo do Plate.js - pode ser tipado com tipos específicos do Plate
  autor_id: number;
  pasta_id?: number | null;
  criado_em?: string;
  atualizado_em?: string;
}

/**
 * Tipo de documento com informações do usuário (autor)
 */
export interface DocumentoComUsuario extends Documento {
  autor?: {
    id: number;
    nomeCompleto: string;
    emailCorporativo: string;
  };
}

/**
 * Tipo para representar o conteúdo do editor (Plate.js)
 */
export type ConteudoDocumento = Descendant[];

/**
 * Tipo para dados de auto-save
 */
export interface AutoSaveData {
  documento_id: number;
  conteudo: ConteudoDocumento;
  titulo: string;
}

/**
 * Tipo para atualização de documento
 */
export interface AtualizarDocumentoData {
  titulo?: string;
  conteudo?: ConteudoDocumento;
  pasta_id?: number | null;
}
