/**
 * Serviço de persistência para Permissões
 * Gerencia operações CRUD na tabela permissoes
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { invalidarCacheUsuario } from '@/backend/utils/auth/authorization';
import {
  registrarAtribuicaoPermissao,
  registrarRevogacaoPermissao,
  registrarAtribuicaoLote,
  registrarSubstituicaoPermissoes,
} from '@/backend/utils/logs/auditoria-permissoes';
import type {
  Permissao,
  AtribuirPermissaoDTO,
  Recurso,
  Operacao,
} from '@/backend/types/permissoes/types';

/**
 * Listar todas as permissões de um usuário
 */
export const listarPermissoesUsuario = async (
  usuarioId: number
): Promise<Permissao[]> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('permissoes')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('recurso', { ascending: true })
    .order('operacao', { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar permissões: ${error.message}`);
  }

  return data || [];
};

/**
 * Verificar se usuário possui permissão específica
 */
export const verificarPermissao = async (
  usuarioId: number,
  recurso: Recurso,
  operacao: Operacao
): Promise<boolean> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('permissoes')
    .select('permitido')
    .eq('usuario_id', usuarioId)
    .eq('recurso', recurso)
    .eq('operacao', operacao)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return false; // Não encontrado = não tem permissão
    }
    throw new Error(`Erro ao verificar permissão: ${error.message}`);
  }

  return data?.permitido ?? false;
};

/**
 * Atribuir permissão a um usuário (upsert)
 */
export const atribuirPermissao = async (
  usuarioId: number,
  recurso: Recurso,
  operacao: Operacao,
  permitido: boolean = true,
  executadoPor?: number
): Promise<Permissao> => {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('permissoes')
    .upsert(
      {
        usuario_id: usuarioId,
        recurso,
        operacao,
        permitido,
      },
      {
        onConflict: 'usuario_id,recurso,operacao',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atribuir permissão: ${error.message}`);
  }

  // Registrar log de auditoria
  if (executadoPor) {
    await registrarAtribuicaoPermissao(usuarioId, recurso, operacao, executadoPor);
  }

  // Invalidar cache do usuário
  invalidarCacheUsuario(usuarioId);

  return data;
};

/**
 * Atribuir múltiplas permissões de uma vez (batch)
 */
export const atribuirPermissoesBatch = async (
  usuarioId: number,
  permissoes: AtribuirPermissaoDTO[],
  executadoPor?: number
): Promise<Permissao[]> => {
  const supabase = createServiceClient();

  const inserts = permissoes.map((p) => ({
    usuario_id: usuarioId,
    recurso: p.recurso,
    operacao: p.operacao,
    permitido: p.permitido !== undefined ? p.permitido : true,
  }));

  const { data, error } = await supabase
    .from('permissoes')
    .upsert(inserts, {
      onConflict: 'usuario_id,recurso,operacao',
    })
    .select();

  if (error) {
    throw new Error(`Erro ao atribuir permissões em lote: ${error.message}`);
  }

  // Registrar log de auditoria
  if (executadoPor) {
    const permissoesLog = permissoes.map((p) => ({
      recurso: p.recurso,
      operacao: p.operacao,
    }));
    await registrarAtribuicaoLote(usuarioId, permissoesLog, executadoPor);
  }

  // Invalidar cache do usuário
  invalidarCacheUsuario(usuarioId);

  return data || [];
};

/**
 * Revogar permissão específica
 */
export const revogarPermissao = async (
  usuarioId: number,
  recurso: Recurso,
  operacao: Operacao,
  executadoPor?: number
): Promise<void> => {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('permissoes')
    .delete()
    .eq('usuario_id', usuarioId)
    .eq('recurso', recurso)
    .eq('operacao', operacao);

  if (error) {
    throw new Error(`Erro ao revogar permissão: ${error.message}`);
  }

  // Registrar log de auditoria
  if (executadoPor) {
    await registrarRevogacaoPermissao(usuarioId, recurso, operacao, executadoPor);
  }

  // Invalidar cache do usuário
  invalidarCacheUsuario(usuarioId);
};

/**
 * Revogar todas as permissões de um usuário
 */
export const revogarTodasPermissoes = async (usuarioId: number): Promise<void> => {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('permissoes')
    .delete()
    .eq('usuario_id', usuarioId);

  if (error) {
    throw new Error(`Erro ao revogar todas as permissões: ${error.message}`);
  }

  // Invalidar cache do usuário
  invalidarCacheUsuario(usuarioId);
};

/**
 * Substituir todas as permissões de um usuário (delete + insert em transação)
 */
export const substituirPermissoes = async (
  usuarioId: number,
  permissoes: AtribuirPermissaoDTO[],
  executadoPor?: number
): Promise<Permissao[]> => {
  const supabase = createServiceClient();

  // 1. Contar permissões antigas
  const { count: permissoesAntigas } = await supabase
    .from('permissoes')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId);

  // 2. Deletar todas as permissões existentes
  await revogarTodasPermissoes(usuarioId);

  // 3. Se não há permissões novas, retornar array vazio
  if (permissoes.length === 0) {
    // Registrar log de auditoria
    if (executadoPor) {
      await registrarSubstituicaoPermissoes(
        usuarioId,
        permissoesAntigas || 0,
        0,
        executadoPor
      );
    }
    return [];
  }

  // 4. Inserir novas permissões
  const inserts = permissoes.map((p) => ({
    usuario_id: usuarioId,
    recurso: p.recurso,
    operacao: p.operacao,
    permitido: p.permitido !== undefined ? p.permitido : true,
  }));

  const { data, error } = await supabase
    .from('permissoes')
    .insert(inserts)
    .select();

  if (error) {
    throw new Error(`Erro ao substituir permissões: ${error.message}`);
  }

  // Registrar log de auditoria
  if (executadoPor) {
    await registrarSubstituicaoPermissoes(
      usuarioId,
      permissoesAntigas || 0,
      permissoes.length,
      executadoPor
    );
  }

  // Invalidar cache do usuário
  invalidarCacheUsuario(usuarioId);

  return data || [];
};

/**
 * Alias para verificarPermissao (plural para compatibilidade)
 */
export const verificarPermissoes = verificarPermissao;
