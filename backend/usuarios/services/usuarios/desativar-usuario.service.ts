// Serviço de desativação de usuário com desatribuição automática
// Conta itens atribuídos antes de desativar e retorna estatísticas

import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * Resultado da desativação de usuário
 */
export interface DesativacaoResult {
  sucesso: boolean;
  erro?: string;
  itensDesatribuidos?: {
    processos: number;
    audiencias: number;
    pendentes: number;
    expedientes_manuais: number;
    contratos: number;
    total: number;
  };
}

/**
 * Desativa um usuário e desatribui todos os itens atribuídos a ele
 *
 * Passos:
 * 1. Conta itens atribuídos (processos, audiências, pendentes, expedientes, contratos)
 * 2. Define contexto do usuário que está executando a operação
 * 3. Usa funções RPC para desatribuir (registra logs automaticamente)
 * 4. Desativa o usuário
 * 5. Retorna contagens para feedback no frontend
 *
 * @param usuarioId - ID do usuário a ser desativado
 * @param usuarioQueExecutouId - ID do usuário que está executando a desativação
 * @returns Resultado com sucesso e contagens de itens desatribuídos
 */
export async function desativarUsuarioComDesatribuicao(
  usuarioId: number,
  usuarioQueExecutouId: number
): Promise<DesativacaoResult> {
  const supabase = createServiceClient();

  try {
    // ========================================================================
    // 1. Contar itens atribuídos ANTES de desatribuir
    // ========================================================================

    // Contar processos
    const { count: countProcessos, error: errorProcessos } = await supabase
      .from('acervo')
      .select('*', { count: 'exact', head: true })
      .eq('responsavel_id', usuarioId);

    if (errorProcessos) {
      throw new Error(`Erro ao contar processos: ${errorProcessos.message}`);
    }

    // Contar audiências
    const { count: countAudiencias, error: errorAudiencias } = await supabase
      .from('audiencias')
      .select('*', { count: 'exact', head: true })
      .eq('responsavel_id', usuarioId);

    if (errorAudiencias) {
      throw new Error(`Erro ao contar audiências: ${errorAudiencias.message}`);
    }

    // Contar pendentes
    const { count: countPendentes, error: errorPendentes } = await supabase
      .from('expedientes')
      .select('*', { count: 'exact', head: true })
      .eq('responsavel_id', usuarioId);

    if (errorPendentes) {
      throw new Error(`Erro ao contar pendentes: ${errorPendentes.message}`);
    }

    // Contar expedientes manuais
    const { count: countExpedientes, error: errorExpedientes } = await supabase
      .from('expedientes_manuais')
      .select('*', { count: 'exact', head: true })
      .eq('responsavel_id', usuarioId);

    if (errorExpedientes) {
      throw new Error(`Erro ao contar expedientes: ${errorExpedientes.message}`);
    }

    // Contar contratos
    const { count: countContratos, error: errorContratos } = await supabase
      .from('contratos')
      .select('*', { count: 'exact', head: true })
      .eq('responsavel_id', usuarioId);

    if (errorContratos) {
      throw new Error(`Erro ao contar contratos: ${errorContratos.message}`);
    }

    // Montar objeto de contagens
    const contagens = {
      processos: countProcessos ?? 0,
      audiencias: countAudiencias ?? 0,
      pendentes: countPendentes ?? 0,
      expedientes_manuais: countExpedientes ?? 0,
      contratos: countContratos ?? 0,
      total: 0,
    };
    contagens.total =
      contagens.processos +
      contagens.audiencias +
      contagens.pendentes +
      contagens.expedientes_manuais +
      contagens.contratos;

    console.log(`[Desativação] Usuário ${usuarioId} tem ${contagens.total} itens atribuídos`);

    // ========================================================================
    // 2. Definir contexto do usuário que está executando
    // ========================================================================

    // Isso permite que os triggers de log registrem quem executou a operação
    const { error: errorConfig } = await supabase.rpc('set_config', {
      setting_name: 'app.current_user_id',
      new_value: usuarioQueExecutouId.toString(),
      is_local: false,
    });

    if (errorConfig) {
      console.warn('Erro ao definir contexto de usuário:', errorConfig.message);
      // Não é crítico, continua
    }

    // ========================================================================
    // 3. Desatribuir usando funções RPC (se houver itens)
    // ========================================================================

    // Desatribuir processos
    if (contagens.processos > 0) {
      const { error } = await supabase.rpc('desatribuir_todos_processos_usuario', {
        p_usuario_id: usuarioId,
      });

      if (error) {
        throw new Error(`Erro ao desatribuir processos: ${error.message}`);
      }

      console.log(`[Desativação] Desatribuídos ${contagens.processos} processo(s)`);
    }

    // Desatribuir audiências
    if (contagens.audiencias > 0) {
      const { error } = await supabase.rpc('desatribuir_todas_audiencias_usuario', {
        p_usuario_id: usuarioId,
      });

      if (error) {
        throw new Error(`Erro ao desatribuir audiências: ${error.message}`);
      }

      console.log(`[Desativação] Desatribuídas ${contagens.audiencias} audiência(s)`);
    }

    // Desatribuir pendentes
    if (contagens.pendentes > 0) {
      const { error } = await supabase.rpc('desatribuir_todos_pendentes_usuario', {
        p_usuario_id: usuarioId,
      });

      if (error) {
        throw new Error(`Erro ao desatribuir pendentes: ${error.message}`);
      }

      console.log(`[Desativação] Desatribuídos ${contagens.pendentes} pendente(s)`);
    }

    // Desatribuir expedientes manuais
    if (contagens.expedientes_manuais > 0) {
      const { error } = await supabase.rpc('desatribuir_todos_expedientes_usuario', {
        p_usuario_id: usuarioId,
      });

      if (error) {
        throw new Error(`Erro ao desatribuir expedientes: ${error.message}`);
      }

      console.log(
        `[Desativação] Desatribuídos ${contagens.expedientes_manuais} expediente(s)`
      );
    }

    // Desatribuir contratos
    if (contagens.contratos > 0) {
      const { error } = await supabase.rpc('desatribuir_todos_contratos_usuario', {
        p_usuario_id: usuarioId,
      });

      if (error) {
        throw new Error(`Erro ao desatribuir contratos: ${error.message}`);
      }

      console.log(`[Desativação] Desatribuídos ${contagens.contratos} contrato(s)`);
    }

    // ========================================================================
    // 4. Desativar usuário
    // ========================================================================

    const { error: errorDesativar } = await supabase
      .from('usuarios')
      .update({ ativo: false })
      .eq('id', usuarioId);

    if (errorDesativar) {
      throw new Error(`Erro ao desativar usuário: ${errorDesativar.message}`);
    }

    console.log(`[Desativação] Usuário ${usuarioId} desativado com sucesso`);

    // ========================================================================
    // 5. Retornar resultado
    // ========================================================================

    return {
      sucesso: true,
      itensDesatribuidos: contagens,
    };
  } catch (error) {
    console.error('[Desativação] Erro ao desativar usuário:', error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido ao desativar usuário',
    };
  }
}
