/**
 * DASHBOARD FEATURE - Chat Metrics Repository
 *
 * Métricas de chat para o widget do dashboard.
 * Responsabilidades:
 * - Contagem de mensagens recentes não enviadas pelo usuário (últimas 24h)
 * - Contagem de salas ativas onde o usuário é membro
 * - Última mensagem recebida (autor, preview, timestamp, sala)
 *
 * NOTA: O módulo de chat não rastreia status de leitura por mensagem
 * (não existe coluna `lida` em mensagens_chat nem `last_read_at` em
 * membros_sala_chat). A contagem de "não lidas" usa como proxy as
 * mensagens das últimas 24h não enviadas pelo próprio usuário.
 * TODO: Implementar rastreamento real de leitura (last_read_at em membros_sala_chat)
 * quando o produto evoluir para notificações de leitura granulares.
 */

import { createClient } from '@/lib/supabase/server';
import type { ChatResumo } from '../domain';

/**
 * Busca resumo de métricas de chat para o dashboard.
 *
 * @param usuarioId - ID numérico do usuário (consistente com o domínio do chat)
 */
export async function buscarChatResumo(usuarioId: number): Promise<ChatResumo> {
  const supabase = await createClient();

  try {
    // Buscar IDs das salas ativas onde o usuário é membro
    const { data: membros, error: membrosError } = await supabase
      .from('membros_sala_chat')
      .select('sala_id')
      .eq('usuario_id', usuarioId)
      .eq('is_active', true);

    if (membrosError) {
      console.error('[dashboard/chat-metrics] Erro ao buscar membros:', membrosError);
      return { naoLidas: 0, salasAtivas: 0, ultimaMensagem: null };
    }

    const salaIds = membros?.map((m) => m.sala_id) ?? [];
    const salasAtivas = salaIds.length;

    if (salasAtivas === 0) {
      return { naoLidas: 0, salasAtivas: 0, ultimaMensagem: null };
    }

    // Cutoff para "mensagens recentes" (últimas 24h)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Contagem de mensagens recentes não enviadas pelo usuário nas suas salas
    // (proxy para não lidas — sem coluna de leitura disponível)
    const { count: naoLidasCount, error: countError } = await supabase
      .from('mensagens_chat')
      .select('id', { count: 'exact', head: true })
      .in('sala_id', salaIds)
      .neq('usuario_id', usuarioId)
      .is('deleted_at', null)
      .gte('created_at', cutoff);

    if (countError) {
      console.error('[dashboard/chat-metrics] Erro ao contar mensagens:', countError);
    }

    // Última mensagem recebida (não enviada pelo usuário) nas salas ativas
    const { data: ultimaMsg, error: ultimaError } = await supabase
      .from('mensagens_chat')
      .select(
        `
        sala_id,
        conteudo,
        created_at,
        usuario:usuarios!mensagens_chat_usuario_id_fkey(
          nome_exibicao,
          nome_completo
        )
      `
      )
      .in('sala_id', salaIds)
      .neq('usuario_id', usuarioId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ultimaError) {
      console.error('[dashboard/chat-metrics] Erro ao buscar última mensagem:', ultimaError);
    }

    let ultimaMensagem: ChatResumo['ultimaMensagem'] = null;

    if (ultimaMsg) {
      // usuario pode ser array (Supabase relação 1:N via FK) ou objeto
      const usuarioRow = Array.isArray(ultimaMsg.usuario)
        ? ultimaMsg.usuario[0]
        : ultimaMsg.usuario;

      const autor =
        usuarioRow?.nome_exibicao || usuarioRow?.nome_completo || 'Usuário';

      ultimaMensagem = {
        autor,
        preview: (ultimaMsg.conteudo as string)?.slice(0, 80) ?? '',
        tempo: ultimaMsg.created_at as string,
        salaId: String(ultimaMsg.sala_id),
      };
    }

    return {
      naoLidas: naoLidasCount ?? 0,
      salasAtivas,
      ultimaMensagem,
    };
  } catch (error) {
    console.error('[dashboard/chat-metrics] Erro:', error);
    return { naoLidas: 0, salasAtivas: 0, ultimaMensagem: null };
  }
}
