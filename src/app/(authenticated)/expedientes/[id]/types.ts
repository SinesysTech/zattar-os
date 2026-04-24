/**
 * View types da página de detalhe de um expediente.
 *
 * Estes shapes alimentam exclusivamente `ExpedienteDetalhesClient` — não são
 * os domain models canônicos (que vivem em `../domain`). A página server-side
 * normaliza os dados do Supabase (Usuario, TipoExpediente, arquivos derivados
 * do próprio expediente, histórico de `logs_alteracao`) para estes tipos.
 */

import type { Expediente } from '@/app/(authenticated)/expedientes/domain';

export interface DetalheUsuario {
  id: number;
  nomeExibicao: string;
  nomeCompleto: string;
  avatarUrl: string | null;
  cargo?: string;
}

/**
 * Nota: o campo é intencionalmente snake_case `tipo_expediente` para alinhar
 * com o formato consumido pelo `ExpedienteDetalhesClient`.
 */
export interface DetalheTipo {
  id: number;
  tipo_expediente: string;
}

export interface DetalheArquivo {
  id: string;
  nome: string;
  tipo: 'pdf' | 'docx' | 'imagem' | 'outro';
  tamanhoBytes: number;
  url: string;
  criadoEm: string;
  categoria: 'intimacao' | 'decisao' | 'peca' | 'anexo';
}

export interface DetalheHistoricoEvento {
  id: string;
  tipo:
    | 'criacao'
    | 'atribuicao_responsavel'
    | 'alteracao_tipo'
    | 'alteracao_descricao'
    | 'alteracao_observacoes'
    | 'baixa'
    | 'reversao_baixa'
    | 'visualizacao';
  data: string;
  autorId: number | null;
  descricao: string;
  dadosAnteriores?: Record<string, unknown>;
  dadosNovos?: Record<string, unknown>;
}

export interface ExpedienteDetalheBundle {
  expediente: Expediente;
  usuarios: DetalheUsuario[];
  tiposExpedientes: DetalheTipo[];
  arquivos: DetalheArquivo[];
  historico: DetalheHistoricoEvento[];
  decisaoOptions: string[];
}
