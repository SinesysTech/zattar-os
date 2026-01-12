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

type BroadcastNewMessagePayload = {
  id: number;
  salaId: number;
  usuarioId: number;
  conteudo: string;
  tipo: MensagemComUsuario['tipo'];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  status?: string | null;
  data?: unknown;
};

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

  /** Envia broadcast com nova mensagem (fallback quando Postgres Changes falha) */
  broadcastNewMessage: (payload: BroadcastNewMessagePayload) => Promise<void>;
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

    const handleBroadcast = ({ payload }: { payload: unknown }) => {
      if (!payload || typeof payload !== 'object') return;

      const maybe = payload as Partial<BroadcastNewMessagePayload>;
      if (
        typeof maybe.id !== 'number' ||
        typeof maybe.salaId !== 'number' ||
        typeof maybe.usuarioId !== 'number' ||
        typeof maybe.conteudo !== 'string' ||
        typeof maybe.tipo !== 'string' ||
        typeof maybe.createdAt !== 'string' ||
        typeof maybe.updatedAt !== 'string'
      ) {
        return;
      }

      const mensagem: MensagemComUsuario = {
        id: maybe.id,
        salaId: maybe.salaId,
        usuarioId: maybe.usuarioId,
        conteudo: maybe.conteudo,
        tipo: maybe.tipo as MensagemComUsuario['tipo'],
        createdAt: maybe.createdAt,
        updatedAt: maybe.updatedAt,
        deletedAt: maybe.deletedAt ?? null,
        status: (maybe.status as MensagemComUsuario['status']) ?? 'sent',
        data: maybe.data as MensagemComUsuario['data'],
        ownMessage: maybe.usuarioId === currentUserIdRef.current,
        usuario: {
          id: maybe.usuarioId,
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
      .on('broadcast', { event: 'new-message' }, handleBroadcast)
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

  const broadcastNewMessage = async (payload: BroadcastNewMessagePayload) => {
    const channel = channelRef.current;
    if (!channel) return;

    await channel.send({
      type: 'broadcast',
      event: 'new-message',
      payload,
    });
  };

  return {
    isConnected,
    broadcastNewMessage,
  };
}