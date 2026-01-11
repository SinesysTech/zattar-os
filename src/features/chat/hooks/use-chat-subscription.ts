'use client';

/**
 * CHAT FEATURE - useChatSubscription Hook
 *
 * Hook para subscrever a eventos de novas mensagens via Supabase Realtime.
 * Usa Postgres Changes (INSERT events) para sincronização automática.
 */

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { RealtimePostgresInsertPayload, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import type { MensagemComUsuario, MensagemChatRow } from '../domain';

interface UseChatSubscriptionProps {
  /** ID da sala de chat */
  salaId: number;
  /** Callback chamado quando uma nova mensagem chega */
  onNewMessage: (mensagem: MensagemComUsuario) => void;
  /** Se false, não cria subscription (útil para SSR) */
  enabled?: boolean;
  /** ID do usuário atual (para marcar ownMessage) */
  currentUserId: number;
}

interface UseChatSubscriptionReturn {
  /** Indica se o canal está conectado */
  isConnected: boolean;
}

/**
 * Hook para subscrever a eventos de novas mensagens via Supabase Realtime.
 */
export function useChatSubscription({
  salaId,
  onNewMessage,
  enabled = true,
  currentUserId,
}: UseChatSubscriptionProps): UseChatSubscriptionReturn {
  const [supabase] = useState(() => createClient());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Usar ref para armazenar o callback mais recente sem causar re-subscription
  const onNewMessageRef = useRef(onNewMessage);
  const currentUserIdRef = useRef(currentUserId);

  // Atualizar refs quando props mudam
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    if (!enabled) return;

    // Handler que usa refs para evitar dependências instáveis
    // Otimização: constrói MensagemComUsuario diretamente do payload Realtime
    // para evitar query adicional por INSERT
    const handleInsert = async (
      payload: RealtimePostgresInsertPayload<MensagemChatRow>
    ) => {
      const msgRow = payload.new;
      
      // Extrair dados de usuário do payload se disponível (de Realtime)
      // Caso contrário, usar valores padrão (será preenchido quando necessário)
      const usuarioId = msgRow.usuario_id;
      
      // Construir mensagem diretamente do payload sem query adicional
      // Dados de usuário podem estar no payload se usando breadcrumbs do Realtime
      const mensagem: MensagemComUsuario = {
        id: msgRow.id,
        salaId: msgRow.sala_id,
        usuarioId: usuarioId,
        conteudo: msgRow.conteudo,
        tipo: msgRow.tipo as MensagemComUsuario['tipo'],
        createdAt: msgRow.created_at,
        updatedAt: msgRow.updated_at,
        deletedAt: msgRow.deleted_at,
        status: msgRow.status || 'sent',
        data: msgRow.data ?? undefined,
        ownMessage: usuarioId === currentUserIdRef.current,
        usuario: {
          id: usuarioId,
          nomeCompleto: '',
          nomeExibicao: '',
          emailCorporativo: '',
          avatar: undefined,
        },
      };

      onNewMessageRef.current(mensagem);
    };

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
      .subscribe((status: REALTIME_SUBSCRIBE_STATES) => {
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
  }, [salaId, enabled, supabase]);

  return {
    isConnected,
  };
}