/**
 * Hook customizado para colaboração em tempo real
 * Gerencia presence tracking e broadcast de eventos do editor
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/app/_lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface CollaboratorPresence {
  user_id: number;
  name: string;
  email: string;
  color: string;
  cursor?: {
    path: number[];
    offset: number;
  };
  selection?: {
    anchor: { path: number[]; offset: number };
    focus: { path: number[]; offset: number };
  };
  last_active: string;
}

interface UseRealtimeCollaborationProps {
  documentoId: number;
  userId: number;
  userName: string;
  userEmail: string;
  onPresenceChange?: (users: CollaboratorPresence[]) => void;
  onRemoteUpdate?: (update: any) => void;
}

export function useRealtimeCollaboration({
  documentoId,
  userId,
  userName,
  userEmail,
}: UseRealtimeCollaborationProps) {
  const supabase = createClient();
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Gerar cor única para o usuário
  const userColor = useCallback(() => {
    const colors = [
      '#ef4444', // red
      '#f59e0b', // amber
      '#10b981', // emerald
      '#3b82f6', // blue
      '#8b5cf6', // violet
      '#ec4899', // pink
    ];
    return colors[userId % colors.length];
  }, [userId]);

  // Inicializar presence tracking
  useEffect(() => {
    const channel = supabase.channel(`documento:${documentoId}`, {
      config: {
        presence: {
          key: userId.toString(),
        },
      },
    });

    // Subscribe a mudanças de presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const users: CollaboratorPresence[] = [];

        Object.keys(presenceState).forEach((key) => {
          const presences = presenceState[key] as any[];
          presences.forEach((presence) => {
            if (presence.user_id !== userId) {
              users.push(presence);
            }
          });
        });

        setCollaborators(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Enviar presence inicial
          await channel.track({
            user_id: userId,
            name: userName,
            email: userEmail,
            color: userColor(),
            last_active: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [documentoId, userId, userName, userEmail, userColor, supabase]);

  // Atualizar cursor position
  const updateCursor = useCallback(
    async (cursor: { path: number[]; offset: number } | null) => {
      if (channelRef.current) {
        await channelRef.current.track({
          user_id: userId,
          name: userName,
          email: userEmail,
          color: userColor(),
          cursor,
          last_active: new Date().toISOString(),
        });
      }
    },
    [userId, userName, userEmail, userColor]
  );

  // Atualizar selection
  const updateSelection = useCallback(
    async (selection: {
      anchor: { path: number[]; offset: number };
      focus: { path: number[]; offset: number };
    } | null) => {
      if (channelRef.current) {
        await channelRef.current.track({
          user_id: userId,
          name: userName,
          email: userEmail,
          color: userColor(),
          selection,
          last_active: new Date().toISOString(),
        });
      }
    },
    [userId, userName, userEmail, userColor]
  );

  // Broadcast de mudança de conteúdo
  const broadcastUpdate = useCallback(
    async (update: any) => {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'content_update',
          payload: update,
        });
      }
    },
    []
  );

  return {
    collaborators,
    updateCursor,
    updateSelection,
    broadcastUpdate,
  };
}
