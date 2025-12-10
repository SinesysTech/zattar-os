'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from ' @/lib/supabase/client';
import { MensagemComUsuario } from ' @/core/chat/domain';
import { RealtimeChannel } from ' @supabase/supabase-js';

interface UseChatSubscriptionProps {
  salaId: number;
  onNewMessage: (mensagem: MensagemComUsuario) => void;
  enabled?: boolean;
}

/**
 * Hook para subscrever a eventos de novas mensagens via Supabase Realtime.
 * 
 * Usa Postgres Changes (INSERT events) para garantir sincronização automática
 * de todas as mensagens persistidas no banco.
 * 
 * @param salaId - ID da sala de chat
 * @param onNewMessage - Callback chamado quando uma nova mensagem chega
 * @param enabled - Se false, não cria subscription (útil para SSR)
 */
export function useChatSubscription({
  salaId,
  onNewMessage,
  enabled = true,
}: UseChatSubscriptionProps) {
  const supabase = useRef(createClient()).current;
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleInsert = useCallback(
    async (payload: any) => {
      // Payload contém apenas os dados brutos da tabela
      // Precisamos buscar os dados completos com join de usuário
      const { data, error } = await supabase
        .from('mensagens_chat')
        .select(`
          *,
          usuario:usuarios!mensagens_chat_usuario_id_fkey(
            id,
            nome_completo,
            nome_exibicao,
            email_corporativo
          )
        `)
        .eq('id', payload.new.id)
        .single();

      if (error) {
        console.error('Erro ao buscar mensagem completa:', error);
        return;
      }

      // Converter snake_case para camelCase
      const mensagem: MensagemComUsuario = {
        id: data.id,
        salaId: data.sala_id,
        usuarioId: data.usuario_id,
        conteudo: data.conteudo,
        tipo: data.tipo as any,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        deletedAt: data.deleted_at,
        usuario: {
          id: data.usuario.id,
          nomeCompleto: data.usuario.nome_completo,
          nomeExibicao: data.usuario.nome_exibicao,
          emailCorporativo: data.usuario.email_corporativo,
        },
      };

      onNewMessage(mensagem);
    },
    [supabase, onNewMessage]
  );

  useEffect(() => {
    if (!enabled) return;

    // Criar canal específico para a sala
    const channel = supabase.channel(`sala_${salaId}_messages`);
    channelRef.current = channel;

    // Subscrever a INSERT events na tabela mensagens_chat
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_chat',
          filter: `sala_id=eq.${salaId}`,
        },
        handleInsert
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscrito à sala ${salaId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Erro ao subscrever à sala ${salaId}`);
        }
      });

    // Cleanup: remover canal ao desmontar
    return () => {
      console.log(`🔌 Desconectando da sala ${salaId}`);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [salaId, enabled, supabase, handleInsert]);

  return {
    isConnected: channelRef.current !== null,
  };
}
