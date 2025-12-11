'use client';

/**
 * CHAT FEATURE - useChatSubscription Hook
 *
 * Hook para subscrever a eventos de novas mensagens via Supabase Realtime.
 * Usa Postgres Changes (INSERT events) para sincronização automática.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { MensagemComUsuario } from '../types';

interface UseChatSubscriptionProps {
  /** ID da sala de chat */
  salaId: number;
  /** Callback chamado quando uma nova mensagem chega */
  onNewMessage: (mensagem: MensagemComUsuario) => void;
  /** Se false, não cria subscription (útil para SSR) */
  enabled?: boolean;
}

interface UseChatSubscriptionReturn {
  /** Indica se o canal está conectado */
  isConnected: boolean;
}

/**
 * Hook para subscrever a eventos de novas mensagens via Supabase Realtime.
 *
 * Usa Postgres Changes (INSERT events) para garantir sincronização automática
 * de todas as mensagens persistidas no banco.
 *
 * @example
 * ```tsx
 * useChatSubscription({
 *   salaId: 123,
 *   onNewMessage: (msg) => setMensagens(prev => [...prev, msg]),
 *   enabled: true
 * });
 * ```
 */
export function useChatSubscription({
  salaId,
  onNewMessage,
  enabled = true,
}: UseChatSubscriptionProps): UseChatSubscriptionReturn {
  const [supabase] = useState(() => createClient());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleInsert = useCallback(
    async (payload: { new: { id: number; sala_id: number } }) => {
      // Payload contém apenas os dados brutos da tabela
      // Precisamos buscar os dados completos com join de usuário
      const { data, error } = await supabase
        .from('mensagens_chat')
        .select(
          `
          *,
          usuario:usuarios!mensagens_chat_usuario_id_fkey(
            id,
            nome_completo,
            nome_exibicao,
            email_corporativo
          )
        `
        )
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
        tipo: data.tipo,
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
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Chat] Subscrito à sala ${salaId}`);
          setIsConnected(true);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[Chat] Erro ao subscrever à sala ${salaId}`);
          setIsConnected(false);
        }
      });

    // Cleanup: remover canal ao desmontar
    return () => {
      console.log(`[Chat] Desconectando da sala ${salaId}`);
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [salaId, enabled, supabase, handleInsert]);

  return {
    isConnected,
  };
}
