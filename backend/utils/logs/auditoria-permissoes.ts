/**
 * Helper para logs de auditoria de permissões
 * Registra todas as alterações de permissões na tabela logs_alteracao
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { Recurso, Operacao } from '@/backend/types/permissoes/types';

/**
 * Registrar atribuição de permissão
 */
export const registrarAtribuicaoPermissao = async (
  usuarioId: number,
  recurso: Recurso,
  operacao: Operacao,
  executadoPor: number
): Promise<void> => {
  const supabase = createServiceClient();

  await supabase.from('logs_alteracao').insert({
    tipo_entidade: 'usuarios',
    entidade_id: usuarioId,
    tipo_evento: 'permissao_atribuida',
    usuario_que_executou_id: executadoPor,
    dados_evento: {
      recurso,
      operacao,
      acao: 'atribuicao',
    },
  });
};

/**
 * Registrar revogação de permissão
 */
export const registrarRevogacaoPermissao = async (
  usuarioId: number,
  recurso: Recurso,
  operacao: Operacao,
  executadoPor: number
): Promise<void> => {
  const supabase = createServiceClient();

  await supabase.from('logs_alteracao').insert({
    tipo_entidade: 'usuarios',
    entidade_id: usuarioId,
    tipo_evento: 'permissao_revogada',
    usuario_que_executou_id: executadoPor,
    dados_evento: {
      recurso,
      operacao,
      acao: 'revogacao',
    },
  });
};

/**
 * Registrar atribuição em lote
 */
export const registrarAtribuicaoLote = async (
  usuarioId: number,
  permissoes: Array<{ recurso: Recurso; operacao: Operacao }>,
  executadoPor: number
): Promise<void> => {
  const supabase = createServiceClient();

  await supabase.from('logs_alteracao').insert({
    tipo_entidade: 'usuarios',
    entidade_id: usuarioId,
    tipo_evento: 'permissoes_atribuidas_lote',
    usuario_que_executou_id: executadoPor,
    dados_evento: {
      total_permissoes: permissoes.length,
      permissoes,
      acao: 'atribuicao_lote',
    },
  });
};

/**
 * Registrar substituição de permissões
 */
export const registrarSubstituicaoPermissoes = async (
  usuarioId: number,
  permissoesAntigas: number,
  permissoesNovas: number,
  executadoPor: number
): Promise<void> => {
  const supabase = createServiceClient();

  await supabase.from('logs_alteracao').insert({
    tipo_entidade: 'usuarios',
    entidade_id: usuarioId,
    tipo_evento: 'permissoes_substituidas',
    usuario_que_executou_id: executadoPor,
    dados_evento: {
      total_permissoes_antigas: permissoesAntigas,
      total_permissoes_novas: permissoesNovas,
      acao: 'substituicao',
    },
  });
};

/**
 * Registrar promoção a super admin
 */
export const registrarPromocaoSuperAdmin = async (
  usuarioId: number,
  executadoPor: number
): Promise<void> => {
  const supabase = createServiceClient();

  await supabase.from('logs_alteracao').insert({
    tipo_entidade: 'usuarios',
    entidade_id: usuarioId,
    tipo_evento: 'promovido_super_admin',
    usuario_que_executou_id: executadoPor,
    dados_evento: {
      acao: 'promocao_super_admin',
      is_super_admin: true,
    },
  });
};

/**
 * Registrar remoção de super admin
 */
export const registrarRemocaoSuperAdmin = async (
  usuarioId: number,
  executadoPor: number
): Promise<void> => {
  const supabase = createServiceClient();

  await supabase.from('logs_alteracao').insert({
    tipo_entidade: 'usuarios',
    entidade_id: usuarioId,
    tipo_evento: 'removido_super_admin',
    usuario_que_executou_id: executadoPor,
    dados_evento: {
      acao: 'remocao_super_admin',
      is_super_admin: false,
    },
  });
};

/**
 * Registrar mudança de cargo
 */
export const registrarMudancaCargo = async (
  usuarioId: number,
  cargoAnteriorId: number | null,
  cargoNovoId: number | null,
  executadoPor: number
): Promise<void> => {
  const supabase = createServiceClient();

  await supabase.from('logs_alteracao').insert({
    tipo_entidade: 'usuarios',
    entidade_id: usuarioId,
    tipo_evento: 'mudanca_cargo',
    usuario_que_executou_id: executadoPor,
    dados_evento: {
      cargo_anterior_id: cargoAnteriorId,
      cargo_novo_id: cargoNovoId,
      acao: 'mudanca_cargo',
    },
  });
};
